"""
Gestion du contenu éditable du site Circum.

Architecture :
  - Textes par défaut : frontend/i18n/locales/*.json (versionnés dans Git)
  - Surcharges admin  : collection MongoDB « site_content_overrides »
  - Copie de secours  : backend/data/content_overrides.json (écrite à chaque sauvegarde)

Le site public charge les surcharges via GET /api/content/overrides et les fusionne
avec le dictionnaire i18n statique (voir frontend/js/main.js).
"""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from io import StringIO
from pathlib import Path
from typing import Any, Optional

from fastapi import HTTPException

logger = logging.getLogger("circum.content")

LANGS = ("fr", "en", "de", "it")
KEY_RE = re.compile(r"^[a-z][a-z0-9_.]{0,119}$")
MAX_VALUE_LEN = 10_000

# Fichiers i18n → identifiant de page affiché dans l'admin
PAGE_FILES: dict[str, str] = {
    "common": "common.json",
    "home": "home.json",
    "apropos": "apropos.json",
    "design": "design.json",
    "fabrication": "fabrication.json",
    "clients": "clients.json",
    "news": "news.json",
    "newsletter": "newsletter.json",
    "carrieres": "carrieres.json",
    "contact": "contact.json",
    "fondateurs": "fondateurs.json",
}

LOCALES_DIR = Path(__file__).resolve().parent.parent / "frontend" / "i18n" / "locales"
BACKUP_JSON = Path(__file__).resolve().parent / "data" / "content_overrides.json"

ALLOWED_TAGS = frozenset({
    "br", "em", "strong", "b", "i", "u", "s", "strike", "del", "mark",
    "span", "a", "sup", "sub", "font",
})
ALLOWED_ATTRS: dict[str, frozenset[str]] = {
    "a": frozenset({"href", "class", "target", "rel"}),
    "span": frozenset({"class", "style"}),
    "font": frozenset({"face", "color", "style"}),
}
ALLOWED_STYLE_PROPS = frozenset({
    "color", "background-color", "font-family", "font-size",
    "font-weight", "font-style", "text-decoration", "text-align",
})
STYLE_UNSAFE_RE = re.compile(r"url\s*\(|expression\s*\(|javascript:|@import", re.I)
BLOCKED_URL_PREFIXES = ("javascript:", "data:", "vbscript:")


class _HtmlSanitizer(HTMLParser):
    """Conserve uniquement les balises sûres autorisées pour l'i18n du site."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._out = StringIO()
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        tag = tag.lower()
        if tag not in ALLOWED_TAGS:
            self._skip_depth += 1
            return
        allowed = ALLOWED_ATTRS.get(tag, frozenset())
        safe_attrs: list[tuple[str, str]] = []
        for name, value in attrs:
            name = name.lower()
            if name not in allowed or value is None:
                continue
            if name == "href":
                href = value.strip()
                if any(href.lower().startswith(p) for p in BLOCKED_URL_PREFIXES):
                    continue
                if not href.startswith(("/", "#", "mailto:", "http://", "https://")):
                    continue
            if name == "style":
                value = _sanitize_style(value)
                if not value:
                    continue
            safe_attrs.append((name, value))
        attr_str = "".join(f' {n}="{_escape_attr(v)}"' for n, v in safe_attrs)
        if tag == "br":
            self._out.write(f"<{tag}{attr_str}>")
        else:
            self._out.write(f"<{tag}{attr_str}>")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag not in ALLOWED_TAGS:
            if self._skip_depth:
                self._skip_depth -= 1
            return
        if tag != "br":
            self._out.write(f"</{tag}>")

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        self._out.write(data)

    def handle_entityref(self, name: str) -> None:
        if not self._skip_depth:
            self._out.write(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if not self._skip_depth:
            self._out.write(f"&#{name};")

    def get_value(self) -> str:
        return self._out.getvalue().strip()


def _escape_attr(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
    )


def _sanitize_style(style: str) -> str:
    """Filtre les déclarations CSS inline autorisées (anti-XSS)."""
    safe: list[str] = []
    for decl in style.split(";"):
        if ":" not in decl:
            continue
        prop, val = decl.split(":", 1)
        prop = prop.strip().lower()
        val = val.strip()
        if prop not in ALLOWED_STYLE_PROPS or not val:
            continue
        if STYLE_UNSAFE_RE.search(val):
            continue
        safe.append(f"{prop}: {val}")
    return "; ".join(safe)


def sanitize_html(value: str) -> str:
    """Nettoie le HTML saisi par l'admin (anti-XSS). Texte brut accepté tel quel."""
    if "<" not in value and "&" not in value:
        return value.strip()
    parser = _HtmlSanitizer()
    try:
        parser.feed(value)
        parser.close()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid HTML in content value")
    return parser.get_value()


def validate_content_key(key: str) -> str:
    key = (key or "").strip()
    if not KEY_RE.match(key):
        raise HTTPException(status_code=400, detail="Invalid content key")
    return key


def validate_lang(lang: str) -> str:
    lang = (lang or "").lower().strip()
    if lang not in LANGS:
        raise HTTPException(status_code=400, detail="Invalid language")
    return lang


def _load_locale_file(page_id: str) -> dict[str, dict[str, str]]:
    filename = PAGE_FILES.get(page_id)
    if not filename:
        raise HTTPException(status_code=400, detail="Unknown page")
    path = LOCALES_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Locale file not found")
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        raise HTTPException(status_code=500, detail="Invalid locale file")
    return data


def load_base_content() -> dict[str, dict[str, str]]:
    """Fusionne tous les fichiers locales en un dict {clé: {lang: texte}}."""
    merged: dict[str, dict[str, str]] = {}
    for page_id in PAGE_FILES:
        path = LOCALES_DIR / PAGE_FILES[page_id]
        if not path.is_file():
            continue
        with path.open(encoding="utf-8") as fh:
            data = json.load(fh)
        if isinstance(data, dict):
            merged.update(data)
    return merged


def list_pages() -> list[dict[str, str]]:
    labels = {
        "common": "Navigation & pied de page",
        "home": "Accueil",
        "apropos": "À propos",
        "design": "Design & Développement",
        "fabrication": "Fabrication",
        "clients": "Clients",
        "news": "News",
        "newsletter": "Newsletter",
        "carrieres": "Carrières",
        "contact": "Contact",
        "fondateurs": "Fondateurs",
    }
    return [{"id": pid, "label": labels.get(pid, pid)} for pid in PAGE_FILES]


async def load_overrides_from_db(db) -> dict[str, dict[str, str]]:
    """Retourne {lang: {clé: texte}} depuis MongoDB."""
    result: dict[str, dict[str, str]] = {lang: {} for lang in LANGS}
    cursor = db["site_content_overrides"].find({})
    async for doc in cursor:
        key = doc.get("_id")
        values = doc.get("values") or {}
        if not isinstance(key, str) or not isinstance(values, dict):
            continue
        for lang in LANGS:
            val = values.get(lang)
            if isinstance(val, str) and val:
                result[lang][key] = val
    return result


async def get_admin_page_content(db, page_id: str, lang: str) -> dict[str, Any]:
    lang = validate_lang(lang)
    base = _load_locale_file(page_id)
    if page_id != "common":
        try:
            common = _load_locale_file("common")
            merged = dict(common)
            merged.update(base)
            base = merged
        except HTTPException:
            pass
    overrides = await load_overrides_from_db(db)
    lang_overrides = overrides.get(lang, {})
    items = []
    for key in sorted(base.keys()):
        entry = base.get(key) or {}
        default_val = entry.get(lang, "")
        override_val = lang_overrides.get(key)
        items.append({
            "key": key,
            "value": override_val if override_val is not None else default_val,
            "default": default_val,
            "is_override": override_val is not None,
        })
    return {"page": page_id, "lang": lang, "count": len(items), "items": items}


async def save_content_updates(db, updates: list[dict[str, str]], updated_by: str) -> dict[str, Any]:
    base = load_base_content()
    now = datetime.now(timezone.utc).isoformat()
    saved = 0

    for item in updates:
        key = validate_content_key(item.get("key", ""))
        lang = validate_lang(item.get("lang", ""))
        if key not in base:
            raise HTTPException(status_code=400, detail=f"Unknown content key: {key}")

        raw = item.get("value", "")
        if not isinstance(raw, str):
            raise HTTPException(status_code=400, detail="Invalid content value")
        if len(raw) > MAX_VALUE_LEN:
            raise HTTPException(status_code=400, detail="Content value too long")

        value = sanitize_html(raw)
        default = (base.get(key) or {}).get(lang, "")

        coll = db["site_content_overrides"]
        if value == default:
            await coll.update_one({"_id": key}, {"$unset": {f"values.{lang}": ""}})
            doc = await coll.find_one({"_id": key})
            values = (doc or {}).get("values") or {}
            if not values:
                await coll.delete_one({"_id": key})
            else:
                await coll.update_one(
                    {"_id": key},
                    {"$set": {"updated_at": now, "updated_by": updated_by}},
                )
        else:
            await coll.update_one(
                {"_id": key},
                {
                    "$set": {
                        f"values.{lang}": value,
                        "updated_at": now,
                        "updated_by": updated_by,
                    }
                },
                upsert=True,
            )
        saved += 1

    await _write_backup_json(db)
    return {"ok": True, "saved": saved}


async def _write_backup_json(db) -> None:
    """Copie de secours lisible sur disque (backend/data/content_overrides.json)."""
    try:
        BACKUP_JSON.parent.mkdir(parents=True, exist_ok=True)
        overrides = await load_overrides_from_db(db)
        flat: dict[str, dict[str, str]] = {}
        for lang in LANGS:
            for key, val in overrides[lang].items():
                flat.setdefault(key, {})[lang] = val
        payload = {
            "_comment": "Surcharges admin — généré automatiquement. Source primaire : MongoDB site_content_overrides.",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "overrides": flat,
        }
        BACKUP_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as exc:
        logger.warning("Could not write content backup JSON: %s", exc)
