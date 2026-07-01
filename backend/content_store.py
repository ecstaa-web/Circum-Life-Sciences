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
    "p", "div", "blockquote", "hr", "small", "abbr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
})
_BLOCK_CLASS_ATTRS = frozenset({"class", "style"})
ALLOWED_ATTRS: dict[str, frozenset[str]] = {
    "a": frozenset({"href", "class", "target", "rel"}),
    "span": frozenset({"class", "style"}),
    "font": frozenset({"face", "color", "style"}),
    "p": _BLOCK_CLASS_ATTRS,
    "div": _BLOCK_CLASS_ATTRS,
    "blockquote": _BLOCK_CLASS_ATTRS,
    "small": _BLOCK_CLASS_ATTRS,
    "abbr": frozenset({"title", "class"}),
    "h1": _BLOCK_CLASS_ATTRS,
    "h2": _BLOCK_CLASS_ATTRS,
    "h3": _BLOCK_CLASS_ATTRS,
    "h4": _BLOCK_CLASS_ATTRS,
    "h5": _BLOCK_CLASS_ATTRS,
    "h6": _BLOCK_CLASS_ATTRS,
    "ul": frozenset({"class"}),
    "ol": frozenset({"class"}),
    "li": frozenset({"class"}),
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
    with path.open(encoding="utf-8-sig") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        raise HTTPException(status_code=500, detail="Invalid locale file")
    return data


def load_base_content() -> dict[str, dict[str, str]]:
    """Fusionne tous les fichiers locales + clés page-i18n-global.js."""
    merged: dict[str, dict[str, str]] = {}
    for page_id in PAGE_FILES:
        path = LOCALES_DIR / PAGE_FILES[page_id]
        if not path.is_file():
            continue
        with path.open(encoding="utf-8-sig") as fh:
            data = json.load(fh)
        if isinstance(data, dict):
            merged.update(data)
    for lang in LANGS:
        for key, val in _load_global_js_keys().get(lang, {}).items():
            merged.setdefault(key, {})[lang] = val
    return merged


def _load_global_js_keys() -> dict[str, dict[str, str]]:
    """Extrait les clés de page-i18n-global.js (textes présents sur le site mais absents des locales)."""
    js_path = LOCALES_DIR.parent.parent / "js" / "i18n" / "page-i18n-global.js"
    result: dict[str, dict[str, str]] = {lang: {} for lang in LANGS}
    if not js_path.is_file():
        return result
    try:
        text = js_path.read_text(encoding="utf-8-sig")
    except OSError:
        return result
    for lang in LANGS:
        block = re.search(rf'"{lang}"\s*:\s*\{{(.*?)\n\s*\}}', text, re.DOTALL)
        if not block:
            continue
        body = block.group(1)
        for km in re.finditer(r'"([a-z][a-z0-9_.]*)"\s*:\s*"((?:\\.|[^"\\])*)"', body):
            key = km.group(1)
            val = km.group(2).replace('\\"', '"').replace("\\n", "\n").replace("\\'", "'")
            result[lang][key] = val
    return result


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
    """Retourne {lang: {clé: texte}} depuis MongoDB (+ fichier backup si besoin)."""
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

    total = sum(len(result[lang]) for lang in LANGS)
    if total == 0 and BACKUP_JSON.is_file():
        try:
            payload = json.loads(BACKUP_JSON.read_text(encoding="utf-8-sig"))
            flat = payload.get("overrides") or {}
            if isinstance(flat, dict):
                for key, langs in flat.items():
                    if not isinstance(key, str) or not isinstance(langs, dict):
                        continue
                    for lang in LANGS:
                        val = langs.get(lang)
                        if isinstance(val, str) and val:
                            result[lang][key] = val
        except Exception as exc:
            logger.warning("Could not read content backup JSON: %s", exc)
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
    now = datetime.now(timezone.utc).isoformat()
    saved = 0
    values: list[dict[str, str]] = []

    for item in updates:
        key = validate_content_key(item.get("key", ""))
        lang = validate_lang(item.get("lang", ""))

        raw = item.get("value", "")
        if not isinstance(raw, str):
            raise HTTPException(status_code=400, detail="Invalid content value")
        if len(raw) > MAX_VALUE_LEN:
            raise HTTPException(status_code=400, detail="Content value too long")

        value = sanitize_html(raw)

        coll = db["site_content_overrides"]
        prev = await coll.find_one({"_id": key})
        old_val = None
        if prev and isinstance(prev.get("values"), dict):
            old_val = prev["values"].get(lang)

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
        await db["content_revisions"].insert_one({
            "_id": f"{key}:{lang}:{now}",
            "key": key,
            "lang": lang,
            "old_value": old_val,
            "new_value": value,
            "created_at": now,
            "created_by": updated_by,
        })
        saved += 1
        values.append({"key": key, "lang": lang, "value": value})

    await _write_backup_json(db)
    return {"ok": True, "saved": saved, "values": values}


async def revert_content_keys(db, items: list[dict[str, str]], updated_by: str) -> dict[str, Any]:
    """Supprime les surcharges pour revenir aux textes par défaut (Git)."""
    reverted = 0
    now = datetime.now(timezone.utc).isoformat()
    coll = db["site_content_overrides"]
    for item in items:
        key = validate_content_key(item.get("key", ""))
        lang = validate_lang(item.get("lang", ""))
        doc = await coll.find_one({"_id": key})
        if not doc:
            continue
        old_val = (doc.get("values") or {}).get(lang)
        await coll.update_one({"_id": key}, {"$unset": {f"values.{lang}": ""}})
        fresh = await coll.find_one({"_id": key})
        if fresh and not (fresh.get("values") or {}):
            await coll.delete_one({"_id": key})
        await db["content_revisions"].insert_one({
            "_id": f"{key}:{lang}:revert:{now}",
            "key": key,
            "lang": lang,
            "old_value": old_val,
            "new_value": None,
            "created_at": now,
            "created_by": updated_by,
            "action": "revert",
        })
        reverted += 1
    await _write_backup_json(db)
    return {"ok": True, "reverted": reverted}


async def list_content_revisions(db, key: str, lang: str, limit: int = 20) -> list[dict[str, Any]]:
    key = validate_content_key(key)
    lang = validate_lang(lang)
    cursor = db["content_revisions"].find({"key": key, "lang": lang}).sort("created_at", -1).limit(limit)
    items = []
    async for doc in cursor:
        items.append({
            "id": doc["_id"],
            "key": doc["key"],
            "lang": doc["lang"],
            "old_value": doc.get("old_value"),
            "new_value": doc.get("new_value"),
            "action": doc.get("action"),
            "created_at": doc.get("created_at"),
            "created_by": doc.get("created_by"),
        })
    return items


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
