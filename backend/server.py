import os
import uuid
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ValidationError

from security import (
    SecurityHeadersMiddleware,
    get_client_ip,
    is_production,
    parse_allowed_origins,
    rate_limit,
    reset_rate_limit,
    validate_upload_magic,
    validate_image_magic,
    validate_uuid,
)
from validators import CareersApplyForm, ContactSubmitForm, NewsletterSubscribe

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("circum")

BACKEND_ROOT = Path(__file__).resolve().parent
MONGO_URL = os.environ.get("MONGO_URL", "json://./data/local_db")
DB_NAME = os.environ.get("DB_NAME", "circum")
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", str(BACKEND_ROOT / "uploads")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
NEWS_MEDIA_DIR = UPLOAD_DIR / "news"
NEWS_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
NEWS_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}
NEWS_IMAGE_MAX_BYTES = 8 * 1024 * 1024

USE_JSON_DB = MONGO_URL.startswith("json://")
client = None
if USE_JSON_DB:
    from json_store import JsonDatabase

    json_path = MONGO_URL.replace("json://", "", 1)
    if not Path(json_path).is_absolute():
        json_path = BACKEND_ROOT / json_path
    db = JsonDatabase(Path(json_path))
    logger.info("Using local JSON database at %s", json_path)
else:
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

app = FastAPI(
    title="Circum Life Sciences API",
    docs_url=None if is_production() else "/docs",
    redoc_url=None if is_production() else "/redoc",
)

app.add_middleware(SecurityHeadersMiddleware)
_cors_kwargs = dict(
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
if is_production():
    app.add_middleware(CORSMiddleware, allow_origins=parse_allowed_origins(), **_cors_kwargs)
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=parse_allowed_origins(),
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
        **_cors_kwargs,
    )


@app.middleware("http")
async def global_api_rate_limit(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        path = request.url.path
        if path == "/api/health" or path.endswith("/health"):
            pass
        else:
            rate_limit(f"api:{get_client_ip(request)}", 600, 3600)
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Invalid request data"})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    logger.exception("Unhandled error: %s", exc)
    detail = "Internal server error"
    if not is_production():
        detail = f"{type(exc).__name__}: {exc}"
    return JSONResponse(status_code=500, content={"detail": detail})


# ============ Models ============
class NewsItem(BaseModel):
    id: str
    title: str
    summary: str
    tag: str
    date: str
    variant: int = 1
    cover_image: Optional[str] = None


class NewsDetail(NewsItem):
    body_html: str = ""
    gallery: List[str] = []


def _news_doc_to_list_item(doc: dict) -> NewsItem:
    return NewsItem(
        id=doc["_id"],
        title=doc["title"],
        summary=doc["summary"],
        tag=doc["tag"],
        date=doc["date"],
        variant=int(doc.get("variant") or 1),
        cover_image=doc.get("cover_image"),
    )


def _news_doc_to_detail(doc: dict) -> NewsDetail:
    base = _news_doc_to_list_item(doc)
    return NewsDetail(
        **base.model_dump(),
        body_html=doc.get("body_html") or doc.get("summary") or "",
        gallery=list(doc.get("gallery") or []),
    )


def _safe_news_media_name(name: str) -> str:
    base = Path(name).name
    if not base or not re.match(r"^news_[a-zA-Z0-9._-]+$", base):
        raise HTTPException(status_code=400, detail="Invalid media filename")
    return base


# ============ Seed ============
SEED_NEWS_IDS = [
    "a1000001-0000-4000-8000-000000000001",
    "a1000001-0000-4000-8000-000000000002",
    "a1000001-0000-4000-8000-000000000003",
    "a1000001-0000-4000-8000-000000000004",
    "a1000001-0000-4000-8000-000000000005",
    "a1000001-0000-4000-8000-000000000006",
    "a1000001-0000-4000-8000-000000000007",
]

SEED_NEWS: List[dict] = [
    {"title": "Compamed & Medica Düsseldorf", "summary": "Circum Life Sciences sera au prochain salon Compamed à Düsseldorf du 17 au 20 novembre 2025 — Hall 8 B, Booth D03.", "tag": "Salon", "date": "2025-11-17", "variant": 1},
    {"title": "Inauguration Force One", "summary": "Inauguration officielle de notre site de production Force One en Tunisie.", "tag": "Inauguration", "date": "2025-10-15", "variant": 2},
    {"title": "Communiqué de presse — 2 octobre 2025", "summary": "Publication du communiqué de presse officiel de Circum Life Sciences.", "tag": "Presse", "date": "2025-10-02", "variant": 3},
    {"title": "Commission européenne : exclusion des entreprises chinoises", "summary": "La Commission européenne limite la part des intrants originaires de Chine dans les achats publics de dispositifs médicaux de plus de 5 M€.", "tag": "Réglementaire", "date": "2025-06-01", "variant": 4},
    {"title": "WHX Dubai — Booth S11.D18A", "summary": "Retrouvez-nous au WHX expo à Dubaï sur notre stand S11.D18A.", "tag": "Salon", "date": "2026-02-01", "variant": 5},
    {"title": "DeviceMed — Mars 2026", "summary": "Circum Life Sciences au DeviceMed en mars 2026.", "tag": "Presse", "date": "2026-03-01", "variant": 6},
    {"title": "Happy New Year — Bonne Année 2026", "summary": "Happy New Year — Bonne Année — Frohes neues Jahr — Buon Anno.", "tag": "Actualité", "date": "2026-01-01", "variant": 1},
]

SEED_NEWSLETTER_ISSUES: List[dict] = [
    {"quarter": "Q1", "year": 2026, "date": "2026-03-01", "title": "Inauguration Force One & perspectives 2026", "summary": "Retour sur l'inauguration officielle du site Force One, certifications obtenues, partenariat INSA Lyon, perspectives commerciales."},
    {"quarter": "Q4", "year": 2025, "date": "2025-12-01", "title": "Bilan annuel & engagements 2026", "summary": "Bilan opérationnel et qualité de l'année écoulée, premiers résultats du programme énergie solaire à Force One, roadmap 2026."},
    {"quarter": "Q3", "year": 2025, "date": "2025-09-01", "title": "Renouvellement ISO 13485 multi-sites", "summary": "Compte-rendu de l'audit annuel sans réserve, focus sur la cleanroom C en construction, interview de Mohamed Rekik."},
    {"quarter": "Q2", "year": 2025, "date": "2025-06-01", "title": "Polymères médicaux : focus PEEK & PEBAX", "summary": "Dossier technique sur les polymères techniques utilisés à Force One, applications cliniques et propriétés mécaniques."},
]


@app.on_event("startup")
async def seed_data():
    if not is_production():
        reset_rate_limit()
        logger.info("Dev mode: rate limits reset on startup")

    if await db["news"].count_documents({}) == 0:
        docs = []
        for idx, n in enumerate(SEED_NEWS):
            article_id = SEED_NEWS_IDS[idx] if idx < len(SEED_NEWS_IDS) else str(uuid.uuid4())
            doc = {
                "_id": article_id,
                **n,
                "body_html": f"<p>{n['summary']}</p>",
                "gallery": [],
                "cover_image": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            docs.append(doc)
        await db["news"].insert_many(docs)

    if await db["newsletter_issues"].count_documents({}) == 0:
        docs = []
        for item in SEED_NEWSLETTER_ISSUES:
            docs.append({
                "_id": str(uuid.uuid4()),
                **item,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        await db["newsletter_issues"].insert_many(docs)


# ============ Public endpoints ============
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "circum"}


@app.get("/api/news", response_model=List[NewsItem])
async def list_news():
    cursor = db["news"].find({}).sort("date", -1)
    items: List[NewsItem] = []
    async for doc in cursor:
        items.append(_news_doc_to_list_item(doc))
    return items


@app.get("/api/news/{article_id}", response_model=NewsDetail)
async def get_news_article(article_id: str):
    article_id = validate_uuid(article_id, "article_id")
    doc = await db["news"].find_one({"_id": article_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Article not found")
    return _news_doc_to_detail(doc)


@app.get("/api/news/media/{filename}")
async def get_news_media(filename: str):
    safe = _safe_news_media_name(filename)
    path = NEWS_MEDIA_DIR / safe
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path)


@app.get("/api/newsletter/issues")
async def list_newsletter_issues():
    cursor = db["newsletter_issues"].find({}).sort("date", -1)
    items = []
    async for d in cursor:
        items.append({
            "id": d["_id"], "quarter": d.get("quarter"), "year": d.get("year"),
            "date": d.get("date"), "title": d.get("title"), "summary": d.get("summary"),
            "link": d.get("link"),
        })
    return {"count": len(items), "items": items}


@app.post("/api/newsletter/subscribe")
async def newsletter_subscribe(payload: NewsletterSubscribe, request: Request):
    rate_limit(f"newsletter:{get_client_ip(request)}", 10, 3600)
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Consent required")
    coll = db["newsletter_subscribers"]
    existing = await coll.find_one({"email": payload.email.lower()})
    if existing:
        return {"ok": True, "already_subscribed": True}
    doc = {
        "_id": str(uuid.uuid4()),
        "firstname": payload.firstname.strip(),
        "lastname": payload.lastname.strip(),
        "email": payload.email.lower(),
        "company": (payload.company or "").strip() or None,
        "role": (payload.role or "").strip() or None,
        "lang": payload.lang or "fr",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await coll.insert_one(doc)
    return {"ok": True, "id": doc["_id"]}


@app.post("/api/careers/apply")
async def careers_apply(
    request: Request,
    firstname: str = Form(...),
    lastname: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    position: str = Form(...),
    location: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    availability: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    consent: str = Form(...),
    website: Optional[str] = Form(None),
    cv: UploadFile = File(...),
):
    rate_limit(f"careers:{get_client_ip(request)}", 5, 3600)
    try:
        form_data = CareersApplyForm.from_form(
            firstname=firstname,
            lastname=lastname,
            email=email,
            phone=phone,
            position=position,
            location=location,
            experience=experience,
            availability=availability,
            message=message,
            consent=consent,
            website=website,
        )
    except (ValidationError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid form data")
    if not form_data.consent:
        raise HTTPException(status_code=400, detail="Consent required")

    allowed_ext = {".pdf", ".doc", ".docx"}
    ext = Path(cv.filename or "").suffix.lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: PDF, DOC, DOCX")

    app_id = str(uuid.uuid4())
    saved_name = f"{app_id}{ext}"
    saved_path = UPLOAD_DIR / saved_name

    max_bytes = 10 * 1024 * 1024
    written = 0
    header_checked = False
    with saved_path.open("wb") as out:
        while True:
            chunk = await cv.read(1024 * 64)
            if not chunk:
                break
            if not header_checked:
                validate_upload_magic(chunk[:16], ext)
                header_checked = True
            written += len(chunk)
            if written > max_bytes:
                out.close()
                saved_path.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="CV too large (max 10 MB)")
            out.write(chunk)

    doc = {
        "_id": app_id,
        "firstname": form_data.firstname,
        "lastname": form_data.lastname,
        "email": str(form_data.email),
        "phone": form_data.phone,
        "position": form_data.position,
        "location": form_data.location,
        "experience": form_data.experience,
        "availability": form_data.availability,
        "message": form_data.message,
        "cv_filename": Path(cv.filename or "cv").name[:255],
        "cv_stored": saved_name,
        "cv_size_bytes": written,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db["careers_applications"].insert_one(doc)
    return {"ok": True, "id": app_id}


@app.post("/api/contact/submit")
async def contact_submit(
    request: Request,
    firstname: str = Form(...),
    lastname: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    company: str = Form(...),
    role: Optional[str] = Form(None),
    country: str = Form(...),
    size: Optional[str] = Form(None),
    type: str = Form(...),
    class_: Optional[str] = Form(None, alias="class"),
    stage: Optional[str] = Form(None),
    volume: Optional[str] = Form(None),
    timeline: Optional[str] = Form(None),
    message: str = Form(...),
    lang: Optional[str] = Form("fr"),
    consent: str = Form(...),
    website: Optional[str] = Form(None),
    attachment: Optional[UploadFile] = File(None),
):
    rate_limit(f"contact:{get_client_ip(request)}", 8, 3600)
    try:
        form_data = ContactSubmitForm.from_form(
            firstname=firstname,
            lastname=lastname,
            email=email,
            phone=phone,
            company=company,
            role=role,
            country=country,
            size=size,
            contact_type=type,
            device_class=class_,
            stage=stage,
            volume=volume,
            timeline=timeline,
            message=message,
            lang=lang,
            consent=consent,
            website=website,
        )
    except (ValidationError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid form data")
    if not form_data.consent:
        raise HTTPException(status_code=400, detail="Consent required")

    msg_id = str(uuid.uuid4())
    attachment_meta = None
    if attachment and attachment.filename:
        allowed_ext = {".pdf", ".doc", ".docx", ".zip"}
        ext = Path(attachment.filename).suffix.lower()
        if ext not in allowed_ext:
            raise HTTPException(status_code=400, detail="Invalid file type. Allowed: PDF, DOC, DOCX, ZIP")
        saved_name = f"contact_{msg_id}{ext}"
        saved_path = UPLOAD_DIR / saved_name
        max_bytes = 12 * 1024 * 1024
        written = 0
        header_checked = False
        with saved_path.open("wb") as out:
            while True:
                chunk = await attachment.read(1024 * 64)
                if not chunk:
                    break
                if not header_checked and ext != ".zip":
                    validate_upload_magic(chunk[:16], ext)
                    header_checked = True
                written += len(chunk)
                if written > max_bytes:
                    out.close()
                    saved_path.unlink(missing_ok=True)
                    raise HTTPException(status_code=400, detail="Attachment too large (max 12 MB)")
                out.write(chunk)
        attachment_meta = {
            "stored": saved_name,
            "filename": Path(attachment.filename).name[:255],
            "size_bytes": written,
        }

    doc = {
        "_id": msg_id,
        "firstname": form_data.firstname,
        "lastname": form_data.lastname,
        "email": str(form_data.email),
        "phone": form_data.phone,
        "company": form_data.company,
        "role": form_data.role,
        "country": form_data.country,
        "size": form_data.size,
        "contact_type": form_data.contact_type,
        "device_class": form_data.device_class,
        "stage": form_data.stage,
        "volume": form_data.volume,
        "timeline": form_data.timeline,
        "message": form_data.message,
        "lang": form_data.lang,
        "attachment": attachment_meta,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db["contact_messages"].insert_one(doc)
    return {"ok": True, "id": msg_id}
