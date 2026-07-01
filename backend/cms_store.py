"""
CMS MVP — pages par blocs, médias, révisions, SEO.
Architecture headless : contenu en MongoDB, rendu via API + cms-page.html.
"""
from __future__ import annotations

import json
import logging
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import HTTPException, UploadFile

from content_store import PAGE_FILES, sanitize_html

logger = logging.getLogger("circum.cms")

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
STATUSES = frozenset({"draft", "published"})
ROLES = frozenset({"admin", "editor"})
BLOCK_TYPES = frozenset({
    "hero", "header", "text", "image", "gallery", "button", "card", "columns",
    "cta", "form", "footer", "spacer", "divider", "video",
})

MEDIA_DIR = Path(__file__).resolve().parent / "uploads" / "cms"
MEDIA_MAX_BYTES = 8 * 1024 * 1024
MEDIA_ALLOWED = frozenset({"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"})

# Pages statiques existantes du site (seed)
STATIC_PAGE_SEEDS = [
    {"slug": "accueil", "title": "Accueil", "linked_html": "index.html", "page_id": "home"},
    {"slug": "apropos", "title": "À propos", "linked_html": "apropos.html", "page_id": "apropos"},
    {"slug": "design", "title": "Design & Développement", "linked_html": "design.html", "page_id": "design"},
    {"slug": "fabrication", "title": "Fabrication", "linked_html": "fabrication.html", "page_id": "fabrication"},
    {"slug": "clients", "title": "Clients", "linked_html": "clients.html", "page_id": "clients"},
    {"slug": "news", "title": "News", "linked_html": "news.html", "page_id": "news"},
    {"slug": "newsletter", "title": "Newsletter", "linked_html": "newsletter.html", "page_id": "newsletter"},
    {"slug": "carrieres", "title": "Carrières", "linked_html": "carrieres.html", "page_id": "carrieres"},
    {"slug": "contact", "title": "Contact", "linked_html": "contact.html", "page_id": "contact"},
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return uuid.uuid4().hex[:16]


def validate_slug(slug: str) -> str:
    slug = (slug or "").strip().lower()
    if not slug or not SLUG_RE.match(slug) or len(slug) > 80:
        raise HTTPException(status_code=400, detail="Invalid slug")
    return slug


def validate_status(status: str) -> str:
    status = (status or "draft").strip().lower()
    if status not in STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    return status


def default_seo(title: str = "") -> dict[str, str]:
    return {
        "meta_title": title,
        "meta_description": "",
        "og_image": "",
        "robots": "index,follow",
    }


def default_block(block_type: str) -> dict[str, Any]:
    bid = _new_id()
    templates: dict[str, dict[str, Any]] = {
        "hero": {
            "type": "hero",
            "eyebrow": "Sous-titre",
            "title": "Titre principal",
            "subtitle": "Description de la section hero.",
            "bg_image": "",
            "cta_label": "En savoir plus",
            "cta_link": "/contact.html",
            "align": "left",
        },
        "header": {
            "type": "header",
            "brand": "Circum Life Sciences",
            "links": [
                {"label": "Accueil", "href": "/index.html"},
                {"label": "Contact", "href": "/contact.html"},
            ],
            "style": "light",
        },
        "text": {
            "type": "text",
            "content": "<p>Rédigez votre contenu ici.</p>",
            "align": "left",
        },
        "image": {
            "type": "image",
            "src": "",
            "alt": "",
            "caption": "",
            "width": "full",
        },
        "gallery": {
            "type": "gallery",
            "columns": "3",
            "images": [
                {"src": "", "alt": "Image 1"},
                {"src": "", "alt": "Image 2"},
                {"src": "", "alt": "Image 3"},
            ],
        },
        "button": {
            "type": "button",
            "label": "Découvrir",
            "link": "/contact.html",
            "style": "primary",
            "align": "center",
        },
        "card": {
            "type": "card",
            "title": "Titre de la carte",
            "text": "<p>Description courte du contenu.</p>",
            "image": "",
            "btn_label": "En savoir plus",
            "btn_link": "#",
        },
        "columns": {
            "type": "columns",
            "layout": "2",
            "columns": [
                {"content": "<p>Colonne 1</p>"},
                {"content": "<p>Colonne 2</p>"},
            ],
        },
        "cta": {
            "type": "cta",
            "title": "Prêt à avancer ?",
            "text": "Contactez notre équipe pour en discuter.",
            "btn_label": "Contact",
            "btn_link": "/contact.html",
        },
        "form": {
            "type": "form",
            "title": "Contactez-nous",
            "subtitle": "Notre équipe vous répond sous 48 h.",
            "submit_label": "Envoyer",
            "fields": ["name", "email", "message"],
        },
        "footer": {
            "type": "footer",
            "text": "Circum Life Sciences — Excellence en dispositifs médicaux.",
            "copyright": "© 2026 Circum Life Sciences",
            "links": [
                {"label": "Mentions légales", "href": "#"},
                {"label": "Contact", "href": "/contact.html"},
            ],
        },
        "spacer": {"type": "spacer", "height": 48},
        "divider": {"type": "divider", "style": "line"},
        "video": {"type": "video", "src": "", "poster": "", "autoplay": False},
    }
    if block_type not in templates:
        raise HTTPException(status_code=400, detail="Unknown block type")
    block = dict(templates[block_type])
    block["id"] = bid
    return block


def sanitize_blocks(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    clean: list[dict[str, Any]] = []
    for block in blocks:
        if not isinstance(block, dict):
            continue
        btype = block.get("type")
        if btype not in BLOCK_TYPES:
            continue
        bid = str(block.get("id") or _new_id())[:32]
        item: dict[str, Any] = {"id": bid, "type": btype}
        if btype == "hero":
            item.update({
                "eyebrow": str(block.get("eyebrow", ""))[:200],
                "title": str(block.get("title", ""))[:500],
                "subtitle": sanitize_html(str(block.get("subtitle", "")))[:2000],
                "bg_image": str(block.get("bg_image", ""))[:500],
                "cta_label": str(block.get("cta_label", ""))[:120],
                "cta_link": str(block.get("cta_link", ""))[:500],
                "align": block.get("align") if block.get("align") in ("left", "center", "right") else "left",
            })
        elif btype == "text":
            item.update({
                "content": sanitize_html(str(block.get("content", "")))[:10000],
                "align": block.get("align") if block.get("align") in ("left", "center", "right") else "left",
            })
        elif btype == "image":
            item.update({
                "src": str(block.get("src", ""))[:500],
                "alt": str(block.get("alt", ""))[:240],
                "caption": str(block.get("caption", ""))[:500],
                "width": block.get("width") if block.get("width") in ("full", "medium", "small") else "full",
            })
        elif btype == "columns":
            cols = block.get("columns") or []
            safe_cols = []
            if isinstance(cols, list):
                for col in cols[:4]:
                    if isinstance(col, dict):
                        safe_cols.append({
                            "content": sanitize_html(str(col.get("content", "")))[:5000],
                        })
            layout = str(block.get("layout", "2"))
            if layout not in ("2", "3"):
                layout = "2"
            item.update({"layout": layout, "columns": safe_cols or [{"content": ""}, {"content": ""}]})
        elif btype == "cta":
            item.update({
                "title": str(block.get("title", ""))[:240],
                "text": sanitize_html(str(block.get("text", "")))[:1000],
                "btn_label": str(block.get("btn_label", ""))[:120],
                "btn_link": str(block.get("btn_link", ""))[:500],
            })
        elif btype == "spacer":
            try:
                height = int(block.get("height", 48))
            except (TypeError, ValueError):
                height = 48
            item["height"] = max(8, min(height, 240))
        elif btype == "divider":
            item["style"] = block.get("style") if block.get("style") in ("line", "dots", "gradient") else "line"
        elif btype == "video":
            item.update({
                "src": str(block.get("src", ""))[:500],
                "poster": str(block.get("poster", ""))[:500],
                "autoplay": bool(block.get("autoplay")),
            })
        elif btype == "header":
            links = []
            for link in (block.get("links") or [])[:8]:
                if isinstance(link, dict):
                    links.append({
                        "label": str(link.get("label", ""))[:80],
                        "href": str(link.get("href", ""))[:500],
                    })
            item.update({
                "brand": str(block.get("brand", ""))[:120],
                "links": links or [{"label": "Accueil", "href": "/"}],
                "style": block.get("style") if block.get("style") in ("light", "dark") else "light",
            })
        elif btype == "gallery":
            imgs = []
            for img in (block.get("images") or [])[:12]:
                if isinstance(img, dict):
                    imgs.append({
                        "src": str(img.get("src", ""))[:500],
                        "alt": str(img.get("alt", ""))[:240],
                    })
            cols = str(block.get("columns", "3"))
            if cols not in ("2", "3", "4"):
                cols = "3"
            item.update({"columns": cols, "images": imgs or [{"src": "", "alt": ""}]})
        elif btype == "button":
            item.update({
                "label": str(block.get("label", ""))[:120],
                "link": str(block.get("link", ""))[:500],
                "style": block.get("style") if block.get("style") in ("primary", "outline") else "primary",
                "align": block.get("align") if block.get("align") in ("left", "center", "right") else "center",
            })
        elif btype == "card":
            item.update({
                "title": str(block.get("title", ""))[:240],
                "text": sanitize_html(str(block.get("text", "")))[:2000],
                "image": str(block.get("image", ""))[:500],
                "btn_label": str(block.get("btn_label", ""))[:120],
                "btn_link": str(block.get("btn_link", ""))[:500],
            })
        elif btype == "form":
            fields = []
            for f in (block.get("fields") or ["name", "email", "message"])[:6]:
                if f in ("name", "email", "phone", "message", "company"):
                    fields.append(f)
            item.update({
                "title": str(block.get("title", ""))[:240],
                "subtitle": str(block.get("subtitle", ""))[:500],
                "submit_label": str(block.get("submit_label", "Envoyer"))[:80],
                "fields": fields or ["name", "email", "message"],
            })
        elif btype == "footer":
            links = []
            for link in (block.get("links") or [])[:8]:
                if isinstance(link, dict):
                    links.append({
                        "label": str(link.get("label", ""))[:80],
                        "href": str(link.get("href", ""))[:500],
                    })
            item.update({
                "text": str(block.get("text", ""))[:500],
                "copyright": str(block.get("copyright", ""))[:200],
                "links": links,
            })
        clean.append(item)
    return clean


def sanitize_seo(seo: Optional[dict[str, Any]], title: str = "") -> dict[str, str]:
    base = default_seo(title)
    if not isinstance(seo, dict):
        return base
    return {
        "meta_title": str(seo.get("meta_title") or title)[:160],
        "meta_description": str(seo.get("meta_description") or "")[:320],
        "og_image": str(seo.get("og_image") or "")[:500],
        "robots": str(seo.get("robots") or "index,follow")[:40],
    }


def page_to_dict(doc: dict[str, Any], include_draft: bool = True) -> dict[str, Any]:
    status = doc.get("status", "draft")
    if not include_draft and status != "published":
        return {}
    return {
        "id": doc.get("_id"),
        "slug": doc.get("slug"),
        "title": doc.get("title"),
        "status": status,
        "page_type": doc.get("page_type", "custom"),
        "linked_html": doc.get("linked_html"),
        "page_id": doc.get("page_id"),
        "blocks": doc.get("blocks") or [],
        "seo": doc.get("seo") or default_seo(doc.get("title", "")),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
        "published_at": doc.get("published_at"),
        "updated_by": doc.get("updated_by"),
        "created_by": doc.get("created_by"),
    }


async def seed_cms_pages(db) -> None:
    """Initialise ou complète les pages liées au site statique existant."""
    now = _now()
    seeded = 0
    for seed in STATIC_PAGE_SEEDS:
        existing = await db["cms_pages"].find_one({"page_id": seed["page_id"]})
        if not existing:
            existing = await db["cms_pages"].find_one({"slug": seed["slug"]})
        if existing:
            continue
        doc = {
            "_id": _new_id(),
            "slug": seed["slug"],
            "title": seed["title"],
            "status": "published",
            "page_type": "static",
            "linked_html": seed["linked_html"],
            "page_id": seed["page_id"],
            "blocks": [],
            "seo": default_seo(seed["title"]),
            "created_at": now,
            "updated_at": now,
            "published_at": now,
            "created_by": "system",
            "updated_by": "system",
        }
        await db["cms_pages"].insert_one(doc)
        seeded += 1
    if seeded:
        logger.info("Seeded %d CMS static pages", seeded)


async def get_user_role(db, email: str) -> str:
    doc = await db["admin_allowlist"].find_one({"_id": email.lower()})
    if not doc:
        return "editor"
    role = (doc.get("role") or "admin").lower()
    return role if role in ROLES else "admin"


async def list_pages(db, status: Optional[str] = None) -> list[dict[str, Any]]:
    query: dict[str, Any] = {}
    if status:
        query["status"] = validate_status(status)
    cursor = db["cms_pages"].find(query).sort("updated_at", -1)
    items = []
    async for doc in cursor:
        items.append(page_to_dict(doc))
    return items


async def get_page(db, page_id: str) -> dict[str, Any]:
    doc = await db["cms_pages"].find_one({"_id": page_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    return page_to_dict(doc)


async def get_page_by_slug(db, slug: str, published_only: bool = True) -> dict[str, Any]:
    slug = validate_slug(slug)
    doc = await db["cms_pages"].find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    if published_only and doc.get("status") != "published":
        raise HTTPException(status_code=404, detail="Page not found")
    return page_to_dict(doc, include_draft=not published_only)


async def create_page(db, payload: dict[str, Any], user_email: str) -> dict[str, Any]:
    slug = validate_slug(payload.get("slug", ""))
    existing = await db["cms_pages"].find_one({"slug": slug})
    if existing:
        raise HTTPException(status_code=409, detail="Slug already exists")
    title = str(payload.get("title") or "Nouvelle page").strip()[:240]
    if not title:
        raise HTTPException(status_code=400, detail="Title required")
    now = _now()
    blocks = sanitize_blocks(payload.get("blocks") or [])
    if not blocks:
        blocks = [default_block("hero"), default_block("text")]
    doc = {
        "_id": _new_id(),
        "slug": slug,
        "title": title,
        "status": "draft",
        "page_type": "custom",
        "linked_html": None,
        "page_id": None,
        "blocks": blocks,
        "seo": sanitize_seo(payload.get("seo"), title),
        "created_at": now,
        "updated_at": now,
        "published_at": None,
        "created_by": user_email,
        "updated_by": user_email,
    }
    await db["cms_pages"].insert_one(doc)
    await _save_revision(db, doc["_id"], doc, user_email, "Création")
    return page_to_dict(doc)


async def update_page(db, page_id: str, payload: dict[str, Any], user_email: str) -> dict[str, Any]:
    doc = await db["cms_pages"].find_one({"_id": page_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    updates: dict[str, Any] = {"updated_at": _now(), "updated_by": user_email}
    if "title" in payload:
        title = str(payload["title"]).strip()[:240]
        if not title:
            raise HTTPException(status_code=400, detail="Title required")
        updates["title"] = title
    if "slug" in payload:
        slug = validate_slug(payload["slug"])
        if slug != doc.get("slug"):
            clash = await db["cms_pages"].find_one({"slug": slug, "_id": {"$ne": page_id}})
            if clash:
                raise HTTPException(status_code=409, detail="Slug already exists")
            updates["slug"] = slug
    if "blocks" in payload:
        updates["blocks"] = sanitize_blocks(payload["blocks"] or [])
    if "seo" in payload:
        title = updates.get("title", doc.get("title", ""))
        updates["seo"] = sanitize_seo(payload["seo"], title)
    if "status" in payload:
        status = validate_status(payload["status"])
        updates["status"] = status
        if status == "published":
            updates["published_at"] = _now()
    await db["cms_pages"].update_one({"_id": page_id}, {"$set": updates})
    updated = await db["cms_pages"].find_one({"_id": page_id})
    await _save_revision(db, page_id, updated, user_email, "Modification")
    return page_to_dict(updated)


async def duplicate_page(db, page_id: str, user_email: str) -> dict[str, Any]:
    doc = await db["cms_pages"].find_one({"_id": page_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    base_slug = doc.get("slug", "page")
    slug = base_slug
    n = 2
    while await db["cms_pages"].find_one({"slug": slug}):
        slug = f"{base_slug}-{n}"
        n += 1
    now = _now()
    new_doc = {
        "_id": _new_id(),
        "slug": slug,
        "title": f"{doc.get('title', 'Page')} (copie)",
        "status": "draft",
        "page_type": "custom",
        "linked_html": None,
        "page_id": None,
        "blocks": json.loads(json.dumps(doc.get("blocks") or [])),
        "seo": dict(doc.get("seo") or default_seo()),
        "created_at": now,
        "updated_at": now,
        "published_at": None,
        "created_by": user_email,
        "updated_by": user_email,
    }
    await db["cms_pages"].insert_one(new_doc)
    await _save_revision(db, new_doc["_id"], new_doc, user_email, "Duplication")
    return page_to_dict(new_doc)


async def delete_page(db, page_id: str) -> dict[str, Any]:
    doc = await db["cms_pages"].find_one({"_id": page_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    if doc.get("page_type") == "static":
        raise HTTPException(status_code=400, detail="Cannot delete static site pages")
    await db["cms_pages"].delete_one({"_id": page_id})
    await db["cms_revisions"].delete_many({"page_id": page_id})
    return {"ok": True, "removed": page_id}


async def publish_page(db, page_id: str, user_email: str) -> dict[str, Any]:
    return await update_page(db, page_id, {"status": "published"}, user_email)


async def _save_revision(db, page_id: str, snapshot: dict[str, Any], user_email: str, label: str) -> None:
    rev = {
        "_id": _new_id(),
        "page_id": page_id,
        "snapshot": {
            "title": snapshot.get("title"),
            "slug": snapshot.get("slug"),
            "status": snapshot.get("status"),
            "blocks": snapshot.get("blocks"),
            "seo": snapshot.get("seo"),
        },
        "label": label[:120],
        "created_at": _now(),
        "created_by": user_email,
    }
    await db["cms_revisions"].insert_one(rev)
    # Garder les 30 dernières versions par page
    cursor = db["cms_revisions"].find({"page_id": page_id}).sort("created_at", -1).skip(30)
    old_ids = [doc["_id"] async for doc in cursor]
    if old_ids:
        await db["cms_revisions"].delete_many({"_id": {"$in": old_ids}})


async def list_revisions(db, page_id: str) -> list[dict[str, Any]]:
    doc = await db["cms_pages"].find_one({"_id": page_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    cursor = db["cms_revisions"].find({"page_id": page_id}).sort("created_at", -1).limit(30)
    items = []
    async for rev in cursor:
        items.append({
            "id": rev["_id"],
            "label": rev.get("label"),
            "created_at": rev.get("created_at"),
            "created_by": rev.get("created_by"),
        })
    return items


async def revert_page(db, page_id: str, revision_id: str, user_email: str) -> dict[str, Any]:
    rev = await db["cms_revisions"].find_one({"_id": revision_id, "page_id": page_id})
    if not rev:
        raise HTTPException(status_code=404, detail="Revision not found")
    snap = rev.get("snapshot") or {}
    payload = {
        "title": snap.get("title"),
        "blocks": snap.get("blocks"),
        "seo": snap.get("seo"),
    }
    return await update_page(db, page_id, payload, user_email)


async def list_media(db) -> list[dict[str, Any]]:
    cursor = db["cms_media"].find({}).sort("created_at", -1)
    items = []
    async for doc in cursor:
        items.append({
            "id": doc["_id"],
            "filename": doc.get("filename"),
            "url": doc.get("url"),
            "mime": doc.get("mime"),
            "size": doc.get("size"),
            "alt": doc.get("alt", ""),
            "created_at": doc.get("created_at"),
            "created_by": doc.get("created_by"),
        })
    return items


async def upload_media(db, file: UploadFile, alt: str, user_email: str) -> dict[str, Any]:
    if not file.content_type or file.content_type not in MEDIA_ALLOWED:
        raise HTTPException(status_code=400, detail="Invalid file type")
    data = await file.read()
    if len(data) > MEDIA_MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large")
    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/svg+xml": ".svg",
    }.get(file.content_type, ".bin")
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    fname = f"{_new_id()}{ext}"
    path = MEDIA_DIR / fname
    path.write_bytes(data)
    url = f"/api/cms/media/{fname}"
    doc = {
        "_id": _new_id(),
        "filename": fname,
        "original_name": (file.filename or fname)[:240],
        "url": url,
        "mime": file.content_type,
        "size": len(data),
        "alt": (alt or "")[:240],
        "created_at": _now(),
        "created_by": user_email,
    }
    await db["cms_media"].insert_one(doc)
    return {
        "id": doc["_id"],
        "filename": fname,
        "url": url,
        "mime": doc["mime"],
        "size": doc["size"],
        "alt": doc["alt"],
        "created_at": doc["created_at"],
    }


async def delete_media(db, media_id: str) -> dict[str, Any]:
    doc = await db["cms_media"].find_one({"_id": media_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Media not found")
    fname = doc.get("filename")
    if fname:
        path = MEDIA_DIR / fname
        if path.is_file():
            try:
                path.unlink()
            except OSError:
                pass
    await db["cms_media"].delete_one({"_id": media_id})
    return {"ok": True, "removed": media_id}


async def replace_media(db, media_id: str, file: UploadFile, user_email: str) -> dict[str, Any]:
    doc = await db["cms_media"].find_one({"_id": media_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Media not found")
    if not file.content_type or file.content_type not in MEDIA_ALLOWED:
        raise HTTPException(status_code=400, detail="Invalid file type")
    if file.content_type == "image/svg+xml":
        raise HTTPException(status_code=400, detail="SVG cannot be cropped")
    data = await file.read()
    if len(data) > MEDIA_MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large")

    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Invalid file type")

    old_fname = doc.get("filename") or ""
    stem = Path(old_fname).stem if old_fname else _new_id()
    new_fname = f"{stem}{ext}"
    old_path = MEDIA_DIR / old_fname if old_fname else None
    new_path = MEDIA_DIR / new_fname

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    new_path.write_bytes(data)
    if old_path and old_path.is_file() and old_path != new_path:
        try:
            old_path.unlink()
        except OSError:
            pass

    url = f"/api/cms/media/{new_fname}"
    update = {
        "filename": new_fname,
        "url": url,
        "mime": file.content_type,
        "size": len(data),
        "updated_at": _now(),
        "updated_by": user_email,
    }
    await db["cms_media"].update_one({"_id": media_id}, {"$set": update})
    return {
        "id": media_id,
        "filename": new_fname,
        "url": url,
        "mime": file.content_type,
        "size": len(data),
        "alt": doc.get("alt", ""),
        "created_at": doc.get("created_at"),
        "updated_at": update["updated_at"],
    }


def media_file_path(filename: str) -> Path:
    if not re.match(r"^[a-z0-9._-]+$", filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = MEDIA_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return path
