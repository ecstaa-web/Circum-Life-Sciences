import os
import csv
import io
import uuid
import asyncio
import logging
import secrets
import bcrypt
import resend
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Response, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ValidationError

from security import (
    SecurityHeadersMiddleware,
    cookie_settings,
    get_client_ip,
    is_production,
    parse_allowed_origins,
    rate_limit,
    safe_error_detail,
    validate_email_path,
    validate_upload_magic,
    validate_image_magic,
    validate_uuid,
)
from content_store import get_admin_page_content, list_pages, load_overrides_from_db, save_content_updates
from validators import (
    AllowlistAdd,
    CareersApplyForm,
    ContactSubmitForm,
    ContentSavePayload,
    ForgotPasswordPayload,
    LoginPayload,
    NewsletterIssueIn,
    NewsletterSubscribe,
    ResetPasswordPayload,
    SessionExchange,
    SetPasswordPayload,
)

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
DEFAULT_ADMIN_EMAIL = os.environ.get("DEFAULT_ADMIN_EMAIL", "stag3@circumlifesciences.com").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Stag3Admin2026!")
if is_production() and not os.environ.get("ADMIN_PASSWORD"):
    raise RuntimeError("ADMIN_PASSWORD must be set in production")
if not os.environ.get("ADMIN_PASSWORD"):
    logger.warning("ADMIN_PASSWORD not set — using dev default (local JSON mode only)")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
APP_PUBLIC_URL = os.environ.get("APP_PUBLIC_URL", "http://127.0.0.1:3000")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_TTL_DAYS = 7
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
RESET_TOKEN_TTL_HOURS = 1

# Base de données : MongoDB (prod) ou fichiers JSON locaux (dev sans admin)
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

app = FastAPI(title="Circum Life Sciences API", docs_url=None if is_production() else "/docs", redoc_url=None if is_production() else "/redoc")

app.add_middleware(SecurityHeadersMiddleware)
_cors_kwargs = dict(
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Circum-CSRF"],
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
        rate_limit(f"api:{get_client_ip(request)}", 600, 3600)
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Invalid request data"})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ============ Helpers ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


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


def _sanitize_news_html(html: str) -> str:
    if not html:
        return ""
    cleaned = re.sub(r"<\s*script\b[^>]*>.*?<\s*/\s*script\s*>", "", html, flags=re.I | re.S)
    cleaned = re.sub(r"<\s*iframe\b[^>]*>.*?<\s*/\s*iframe\s*>", "", cleaned, flags=re.I | re.S)
    cleaned = re.sub(r"\s+on\w+\s*=\s*\"[^\"]*\"", "", cleaned, flags=re.I)
    cleaned = re.sub(r"\s+on\w+\s*=\s*'[^']*'", "", cleaned, flags=re.I)
    return cleaned[:50000]


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


async def _save_news_image(upload: UploadFile, article_id: str, label: str) -> str:
    if not upload or not upload.filename:
        raise HTTPException(status_code=400, detail="Image file required")
    ext = Path(upload.filename).suffix.lower()
    if ext not in NEWS_IMAGE_EXT:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: JPG, PNG, WebP")
    saved_name = f"news_{article_id}_{label}_{uuid.uuid4().hex[:8]}{ext}"
    saved_path = NEWS_MEDIA_DIR / saved_name
    written = 0
    header_checked = False
    with saved_path.open("wb") as out:
        while True:
            chunk = await upload.read(1024 * 64)
            if not chunk:
                break
            if not header_checked:
                validate_image_magic(chunk[:16], ext)
                header_checked = True
            written += len(chunk)
            if written > NEWS_IMAGE_MAX_BYTES:
                out.close()
                saved_path.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="Image too large (max 8 MB)")
            out.write(chunk)
    return saved_name


def _delete_news_files(doc: dict) -> None:
    names = []
    if doc.get("cover_image"):
        names.append(doc["cover_image"])
    names.extend(doc.get("gallery") or [])
    for name in names:
        try:
            path = NEWS_MEDIA_DIR / _safe_news_media_name(name)
            path.unlink(missing_ok=True)
        except HTTPException:
            continue


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
    # Indexes
    await db["users"].create_index("email", unique=True, sparse=True)
    await db["user_sessions"].create_index("session_token", unique=True)
    await db["login_attempts"].create_index("identifier")

    # News
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

    # Newsletter issues seed
    if await db["newsletter_issues"].count_documents({}) == 0:
        docs = []
        for item in SEED_NEWSLETTER_ISSUES:
            docs.append({
                "_id": str(uuid.uuid4()),
                **item,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        await db["newsletter_issues"].insert_many(docs)

    # Admin allow-list
    if await db["admin_allowlist"].count_documents({}) == 0:
        await db["admin_allowlist"].insert_one({
            "_id": DEFAULT_ADMIN_EMAIL,
            "added_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Seed admin user with password (idempotent — set initial password ONLY if user
    # has no password_hash yet. NEVER overwrite a user-set password on restart.)
    existing = await db["users"].find_one({"email": DEFAULT_ADMIN_EMAIL})
    if existing is None and ADMIN_PASSWORD:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db["users"].insert_one({
            "user_id": user_id,
            "email": DEFAULT_ADMIN_EMAIL,
            "name": "Admin Circum",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "auth_methods": ["password"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif existing and not existing.get("password_hash") and ADMIN_PASSWORD:
        # User exists (e.g., from Google flow) but never had a password — bootstrap one.
        await db["users"].update_one(
            {"email": DEFAULT_ADMIN_EMAIL},
            {"$set": {
                "password_hash": hash_password(ADMIN_PASSWORD),
                "auth_methods": list(set((existing.get("auth_methods") or []) + ["password"])),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )


# ============ Auth helpers ============
async def _is_allowlisted(email: str) -> bool:
    return await db["admin_allowlist"].find_one({"_id": email.lower()}) is not None


async def _get_session(request: Request, authorization: Optional[str] = None) -> dict:
    token = request.cookies.get("session_token")
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = await db["user_sessions"].find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Not authenticated")
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db["users"].find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user["_session"] = sess
    return user


async def require_admin(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    user = await _get_session(request, authorization)
    using_bearer = bool(authorization and authorization.lower().startswith("bearer "))
    # CSRF protects cookie-based browser sessions; Bearer tokens are not auto-sent cross-site.
    if request.method not in ("GET", "HEAD", "OPTIONS") and not using_bearer:
        csrf = request.headers.get("x-circum-csrf")
        expected = (user.get("_session") or {}).get("csrf_token")
        if not csrf or not expected or csrf != expected:
            raise HTTPException(status_code=403, detail="Forbidden")
    if not await _is_allowlisted(user["email"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


def _set_session_cookie(response: Response, session_token: str):
    opts = cookie_settings()
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=opts["secure"],
        samesite=opts["samesite"],
        path="/",
        max_age=SESSION_TTL_DAYS * 24 * 3600,
    )


async def _create_session(user_id: str) -> tuple[str, str]:
    token = uuid.uuid4().hex + uuid.uuid4().hex
    csrf = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    await db["user_sessions"].insert_one({
        "user_id": user_id,
        "session_token": token,
        "csrf_token": csrf,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })
    return token, csrf


async def _check_brute_force(email: str, ip: str) -> None:
    identifier = f"{ip}:{email.lower()}"
    doc = await db["login_attempts"].find_one({"identifier": identifier})
    if not doc:
        return
    failed = doc.get("failed", 0)
    if failed < MAX_FAILED_ATTEMPTS:
        return
    last = doc.get("last_failed_at")
    if isinstance(last, str):
        last = datetime.fromisoformat(last)
    if last and last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    if last and (datetime.now(timezone.utc) - last) < timedelta(minutes=LOCKOUT_MINUTES):
        raise HTTPException(status_code=429, detail=f"Too many failed attempts. Try again in {LOCKOUT_MINUTES} minutes.")
    # Lockout expired: clear
    await db["login_attempts"].delete_one({"identifier": identifier})


async def _record_failed_login(email: str, ip: str):
    identifier = f"{ip}:{email.lower()}"
    await db["login_attempts"].update_one(
        {"identifier": identifier},
        {"$inc": {"failed": 1}, "$set": {"last_failed_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


async def _clear_failed_login(email: str, ip: str):
    identifier = f"{ip}:{email.lower()}"
    await db["login_attempts"].delete_one({"identifier": identifier})


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


@app.get("/api/content/overrides")
async def content_overrides_public():
    """
    Surcharges de texte éditées via l'admin.
    Fusionnées côté client avec les dictionnaires i18n statiques (main.js).
    """
    overrides = await load_overrides_from_db(db)
    return overrides


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


# ============ Auth endpoints ============
@app.post("/api/auth/login")
async def auth_login(payload: LoginPayload, request: Request, response: Response):
    email = payload.email.lower()
    ip = get_client_ip(request)

    await _check_brute_force(email, ip)
    rate_limit(f"login:{ip}", 30, 3600)

    user = await db["users"].find_one({"email": email})
    if not user or not user.get("password_hash"):
        await _record_failed_login(email, ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload.password, user["password_hash"]):
        await _record_failed_login(email, ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not await _is_allowlisted(email):
        raise HTTPException(status_code=403, detail="Forbidden")

    await _clear_failed_login(email, ip)
    token, csrf = await _create_session(user["user_id"])
    _set_session_cookie(response, token)
    return {"ok": True, "csrf_token": csrf, "user": {"user_id": user["user_id"], "email": email, "name": user.get("name"), "picture": user.get("picture")}}


# ===== Forgot / Reset password =====
def _build_reset_email_html(reset_url: str, email: str) -> str:
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fa;padding:40px 20px;">
    <tr><td align="center">
      <table cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;max-width:520px;width:100%;border:1px solid #e2e8f0;">
        <tr><td style="padding:32px 32px 12px;">
          <h1 style="margin:0 0 4px;color:#0d2847;font-size:22px;letter-spacing:.02em;">Circum Life Sciences</h1>
          <div style="color:#f365b4;font-size:11px;text-transform:uppercase;letter-spacing:.12em;">Espace administrateur</div>
        </td></tr>
        <tr><td style="padding:12px 32px;">
          <h2 style="margin:18px 0 10px;color:#0d2847;font-size:18px;">Réinitialisation du mot de passe</h2>
          <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
            Bonjour,<br/>
            Vous (ou quelqu'un avec votre adresse <strong>{email}</strong>) avez demandé la réinitialisation du mot de passe de l'espace administrateur Circum.
          </p>
          <p style="margin:24px 0;text-align:center;">
            <a href="{reset_url}" style="background:#205a99;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:.04em;display:inline-block;">Réinitialiser mon mot de passe</a>
          </p>
          <p style="margin:0 0 12px;color:#64748b;font-size:12px;line-height:1.6;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
            <span style="color:#205a99;word-break:break-all;">{reset_url}</span>
          </p>
          <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
            Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe restera inchangé.
          </p>
        </td></tr>
        <tr><td style="padding:18px 32px 28px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;">
          Circum Life Sciences · CDMO Medical Devices · Switzerland · France · Tunisia
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


async def _send_reset_email(to_email: str, reset_url: str) -> bool:
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured; skipping email send")
        return False
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": "Réinitialisation de votre mot de passe administrateur · Circum",
        "html": _build_reset_email_html(reset_url, to_email),
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Reset email sent to {to_email}: {result.get('id') if isinstance(result, dict) else result}")
        return True
    except Exception as e:
        logger.error(f"Failed to send reset email to {to_email}: {e}")
        return False


@app.post("/api/auth/forgot-password")
async def auth_forgot_password(payload: ForgotPasswordPayload, request: Request):
    rate_limit(f"forgot:{get_client_ip(request)}", 5, 3600)
    """Initiate password reset. Always returns 200 with same body to avoid email enumeration."""
    email = payload.email.lower()
    same_response = {"ok": True, "message": "If the email is recognized, a reset link has been sent."}

    # Only send if email is in allow-list (admin only)
    if not await _is_allowlisted(email):
        return same_response

    # Invalidate prior tokens for this email
    await db["password_reset_tokens"].delete_many({"email": email})

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_TTL_HOURS)
    await db["password_reset_tokens"].insert_one({
        "_id": token,
        "email": email,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
        "used": False,
    })

    base = APP_PUBLIC_URL.rstrip("/")
    reset_url = f"{base}/admin.html?reset={token}"
    await _send_reset_email(email, reset_url)
    return same_response


@app.post("/api/auth/reset-password")
async def auth_reset_password(payload: ResetPasswordPayload, request: Request):
    rate_limit(f"reset:{get_client_ip(request)}", 10, 3600)
    doc = await db["password_reset_tokens"].find_one({"_id": payload.token})
    if not doc or doc.get("used"):
        raise HTTPException(status_code=400, detail="Lien invalide ou déjà utilisé")
    expires_at = doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Lien expiré")

    email = doc["email"]
    # Re-verify the user is still in allow-list
    if not await _is_allowlisted(email):
        raise HTTPException(status_code=403, detail="Compte non autorisé")

    pw_hash = hash_password(payload.password)
    existing = await db["users"].find_one({"email": email})
    if existing:
        await db["users"].update_one(
            {"email": email},
            {"$set": {
                "password_hash": pw_hash,
                "auth_methods": list(set((existing.get("auth_methods") or []) + ["password"])),
                "password_updated_at": datetime.now(timezone.utc).isoformat(),
                "password_updated_by": "self-reset",
            }}
        )
    else:
        await db["users"].insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": email.split("@")[0],
            "password_hash": pw_hash,
            "auth_methods": ["password"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "password_updated_by": "self-reset",
        })

    # Mark token used + clear brute-force counters
    await db["password_reset_tokens"].update_one({"_id": payload.token}, {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}})
    await db["login_attempts"].delete_many({"identifier": {"$regex": f":{email}$"}})
    return {"ok": True, "email": email}


@app.post("/api/auth/google/exchange")
async def auth_exchange(payload: SessionExchange, request: Request, response: Response):
    rate_limit(f"oauth:{get_client_ip(request)}", 20, 3600)
    async with httpx.AsyncClient(timeout=10) as http:
        try:
            r = await http.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": payload.session_id})
        except httpx.HTTPError:
            raise HTTPException(status_code=502, detail="Auth provider unavailable")
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    data = r.json()
    email = (data.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not await _is_allowlisted(email):
        raise HTTPException(status_code=403, detail="Forbidden")

    existing = await db["users"].find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db["users"].update_one({"user_id": user_id}, {"$set": {
            "name": data.get("name") or existing.get("name"),
            "picture": data.get("picture") or existing.get("picture"),
            "auth_methods": list(set((existing.get("auth_methods") or []) + ["google"])),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db["users"].insert_one({
            "user_id": user_id, "email": email, "name": data.get("name"), "picture": data.get("picture"),
            "auth_methods": ["google"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token, csrf = await _create_session(user_id)
    _set_session_cookie(response, session_token)
    return {"ok": True, "csrf_token": csrf, "user": {"user_id": user_id, "email": email, "name": data.get("name"), "picture": data.get("picture")}}


@app.get("/api/auth/me")
async def auth_me(request: Request, authorization: Optional[str] = Header(None)):
    user = await _get_session(request, authorization)
    csrf = (user.get("_session") or {}).get("csrf_token")
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name"),
        "picture": user.get("picture"),
        "csrf_token": csrf,
    }


@app.post("/api/auth/logout")
async def auth_logout(request: Request, response: Response, authorization: Optional[str] = Header(None)):
    token = request.cookies.get("session_token") or (authorization[7:].strip() if authorization and authorization.lower().startswith("bearer ") else None)
    if token:
        await db["user_sessions"].delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ============ Admin endpoints ============
@app.get("/api/admin/leads")
async def admin_list_leads(_: dict = Depends(require_admin)):
    cursor = db["newsletter_subscribers"].find({}).sort("created_at", -1)
    items = []
    async for d in cursor:
        items.append({
            "id": d["_id"], "firstname": d.get("firstname"), "lastname": d.get("lastname"),
            "email": d.get("email"), "company": d.get("company"), "role": d.get("role"),
            "lang": d.get("lang"), "created_at": d.get("created_at"),
        })
    return {"count": len(items), "items": items}


@app.delete("/api/admin/leads/{lead_id}")
async def admin_delete_lead(lead_id: str, _: dict = Depends(require_admin)):
    lead_id = validate_uuid(lead_id, "lead_id")
    res = await db["newsletter_subscribers"].delete_one({"_id": lead_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"ok": True, "removed": lead_id}


@app.get("/api/admin/applications")
async def admin_list_applications(_: dict = Depends(require_admin)):
    cursor = db["careers_applications"].find({}).sort("created_at", -1)
    items = []
    async for d in cursor:
        items.append({
            "id": d["_id"], "firstname": d.get("firstname"), "lastname": d.get("lastname"),
            "email": d.get("email"), "phone": d.get("phone"), "position": d.get("position"),
            "location": d.get("location"), "experience": d.get("experience"),
            "availability": d.get("availability"), "message": d.get("message"),
            "cv_filename": d.get("cv_filename"), "cv_size_bytes": d.get("cv_size_bytes"),
            "created_at": d.get("created_at"),
        })
    return {"count": len(items), "items": items}


@app.delete("/api/admin/applications/{app_id}")
async def admin_delete_application(app_id: str, _: dict = Depends(require_admin)):
    app_id = validate_uuid(app_id, "application_id")
    doc = await db["careers_applications"].find_one({"_id": app_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Application not found")
    # Cleanup uploaded file
    stored = doc.get("cv_stored")
    if stored:
        p = UPLOAD_DIR / stored
        if p.exists():
            try:
                p.unlink()
            except Exception:
                pass
    await db["careers_applications"].delete_one({"_id": app_id})
    return {"ok": True, "removed": app_id}


@app.get("/api/admin/contact")
async def admin_list_contact(_: dict = Depends(require_admin)):
    cursor = db["contact_messages"].find({}).sort("created_at", -1)
    items = []
    async for d in cursor:
        att = d.get("attachment") or {}
        items.append({
            "id": d["_id"],
            "firstname": d.get("firstname"),
            "lastname": d.get("lastname"),
            "email": d.get("email"),
            "phone": d.get("phone"),
            "company": d.get("company"),
            "role": d.get("role"),
            "country": d.get("country"),
            "size": d.get("size"),
            "contact_type": d.get("contact_type"),
            "device_class": d.get("device_class"),
            "stage": d.get("stage"),
            "volume": d.get("volume"),
            "timeline": d.get("timeline"),
            "message": d.get("message"),
            "lang": d.get("lang"),
            "attachment_filename": att.get("filename"),
            "attachment_size_bytes": att.get("size_bytes"),
            "created_at": d.get("created_at"),
        })
    return {"count": len(items), "items": items}


@app.delete("/api/admin/contact/{msg_id}")
async def admin_delete_contact(msg_id: str, _: dict = Depends(require_admin)):
    msg_id = validate_uuid(msg_id, "message_id")
    doc = await db["contact_messages"].find_one({"_id": msg_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Message not found")
    att = doc.get("attachment") or {}
    stored = att.get("stored")
    if stored:
        p = UPLOAD_DIR / stored
        if p.exists():
            try:
                p.unlink()
            except Exception:
                pass
    await db["contact_messages"].delete_one({"_id": msg_id})
    return {"ok": True, "removed": msg_id}


def _csv_stream(rows: List[dict], headers: List[str]) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for r in rows:
        writer.writerow({h: (r.get(h) if r.get(h) is not None else "") for h in headers})
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv; charset=utf-8")


@app.get("/api/admin/leads.csv")
async def admin_leads_csv(_: dict = Depends(require_admin)):
    data = await admin_list_leads(_=_)
    headers = ["id", "firstname", "lastname", "email", "company", "role", "lang", "created_at"]
    resp = _csv_stream(data["items"], headers)
    resp.headers["Content-Disposition"] = 'attachment; filename="circum_leads.csv"'
    return resp


@app.get("/api/admin/leads.json")
async def admin_leads_json(_: dict = Depends(require_admin)):
    data = await admin_list_leads(_=_)
    return JSONResponse(data, headers={"Content-Disposition": 'attachment; filename="circum_leads.json"'})


@app.get("/api/admin/applications.csv")
async def admin_apps_csv(_: dict = Depends(require_admin)):
    data = await admin_list_applications(_=_)
    headers = ["id", "firstname", "lastname", "email", "phone", "position", "location", "experience", "availability", "message", "cv_filename", "cv_size_bytes", "created_at"]
    resp = _csv_stream(data["items"], headers)
    resp.headers["Content-Disposition"] = 'attachment; filename="circum_applications.csv"'
    return resp


@app.get("/api/admin/applications.json")
async def admin_apps_json(_: dict = Depends(require_admin)):
    data = await admin_list_applications(_=_)
    return JSONResponse(data, headers={"Content-Disposition": 'attachment; filename="circum_applications.json"'})


@app.get("/api/admin/contact.csv")
async def admin_contact_csv(_: dict = Depends(require_admin)):
    data = await admin_list_contact(_=_)
    headers = [
        "id", "firstname", "lastname", "email", "phone", "company", "role", "country",
        "size", "contact_type", "device_class", "stage", "volume", "timeline",
        "message", "lang", "attachment_filename", "created_at",
    ]
    resp = _csv_stream(data["items"], headers)
    resp.headers["Content-Disposition"] = 'attachment; filename="circum_contact.csv"'
    return resp


@app.get("/api/admin/contact.json")
async def admin_contact_json(_: dict = Depends(require_admin)):
    data = await admin_list_contact(_=_)
    return JSONResponse(data, headers={"Content-Disposition": 'attachment; filename="circum_contact.json"'})


@app.get("/api/careers/cv/{application_id}")
async def download_cv(application_id: str, _: dict = Depends(require_admin)):
    application_id = validate_uuid(application_id, "application_id")
    doc = await db["careers_applications"].find_one({"_id": application_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    stored = doc.get("cv_stored") or ""
    if not stored or ".." in stored or stored.startswith(("/", "\\")):
        raise HTTPException(status_code=404, detail="Not found")
    path = (UPLOAD_DIR / stored).resolve()
    try:
        path.relative_to(UPLOAD_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")
    if not path.is_file():
        raise HTTPException(status_code=404, detail="File missing")
    safe_name = Path(doc.get("cv_filename") or path.name).name
    return FileResponse(path, filename=safe_name)


@app.get("/api/contact/attachment/{msg_id}")
async def download_contact_attachment(msg_id: str, _: dict = Depends(require_admin)):
    msg_id = validate_uuid(msg_id, "message_id")
    doc = await db["contact_messages"].find_one({"_id": msg_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    att = doc.get("attachment") or {}
    stored = att.get("stored") or ""
    if not stored or ".." in stored or stored.startswith(("/", "\\")):
        raise HTTPException(status_code=404, detail="Not found")
    path = (UPLOAD_DIR / stored).resolve()
    try:
        path.relative_to(UPLOAD_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")
    if not path.is_file():
        raise HTTPException(status_code=404, detail="File missing")
    safe_name = Path(att.get("filename") or path.name).name
    return FileResponse(path, filename=safe_name)


# ============ Admin allow-list ============
@app.get("/api/admin/allowlist")
async def allowlist_list(_: dict = Depends(require_admin)):
    cursor = db["admin_allowlist"].find({}).sort("created_at", 1)
    items = []
    async for d in cursor:
        items.append({"email": d["_id"], "added_by": d.get("added_by"), "created_at": d.get("created_at")})
    return {"count": len(items), "items": items}


@app.post("/api/admin/allowlist")
async def allowlist_add(payload: AllowlistAdd, user: dict = Depends(require_admin)):
    email = payload.email.lower()
    if await db["admin_allowlist"].find_one({"_id": email}):
        return {"ok": True, "already_present": True}
    await db["admin_allowlist"].insert_one({
        "_id": email, "added_by": user["email"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True, "email": email}


@app.delete("/api/admin/allowlist/{email}")
async def allowlist_remove(email: str, user: dict = Depends(require_admin)):
    email = validate_email_path(email)
    total = await db["admin_allowlist"].count_documents({})
    if total <= 1:
        raise HTTPException(status_code=400, detail="At least one admin must remain")
    if email == user["email"]:
        raise HTTPException(status_code=400, detail="You cannot remove yourself")
    res = await db["admin_allowlist"].delete_one({"_id": email})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Email not in allow-list")
    return {"ok": True, "removed": email}


@app.put("/api/admin/allowlist/{email}/password")
async def allowlist_set_password(email: str, payload: SetPasswordPayload, user: dict = Depends(require_admin)):
    email = validate_email_path(email)
    if not await _is_allowlisted(email):
        raise HTTPException(status_code=404, detail="Email not in allow-list")

    pw_hash = hash_password(payload.password)
    existing = await db["users"].find_one({"email": email})
    if existing:
        await db["users"].update_one(
            {"email": email},
            {"$set": {
                "password_hash": pw_hash,
                "auth_methods": list(set((existing.get("auth_methods") or []) + ["password"])),
                "password_updated_at": datetime.now(timezone.utc).isoformat(),
                "password_updated_by": user["email"],
            }}
        )
    else:
        await db["users"].insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": email.split("@")[0],
            "password_hash": pw_hash,
            "auth_methods": ["password"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "password_updated_by": user["email"],
        })
    # Clear any active brute-force counters for this email
    await db["login_attempts"].delete_many({"identifier": {"$regex": f":{email}$"}})
    return {"ok": True, "email": email}


# ============ Admin newsletter issues CRUD ============
@app.get("/api/admin/newsletter/issues")
async def admin_list_issues(_: dict = Depends(require_admin)):
    return await list_newsletter_issues()


@app.post("/api/admin/newsletter/issues")
async def admin_create_issue(payload: NewsletterIssueIn, _: dict = Depends(require_admin)):
    doc = {
        "_id": str(uuid.uuid4()),
        "quarter": payload.quarter.upper().strip(),
        "year": payload.year,
        "date": payload.date,
        "title": payload.title.strip(),
        "summary": payload.summary.strip(),
        "link": (payload.link or "").strip() or None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db["newsletter_issues"].insert_one(doc)
    return {"ok": True, "id": doc["_id"]}


@app.put("/api/admin/newsletter/issues/{issue_id}")
async def admin_update_issue(issue_id: str, payload: NewsletterIssueIn, _: dict = Depends(require_admin)):
    issue_id = validate_uuid(issue_id, "issue_id")
    res = await db["newsletter_issues"].update_one(
        {"_id": issue_id},
        {"$set": {
            "quarter": payload.quarter.upper().strip(),
            "year": payload.year,
            "date": payload.date,
            "title": payload.title.strip(),
            "summary": payload.summary.strip(),
            "link": (payload.link or "").strip() or None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {"ok": True, "id": issue_id}


@app.delete("/api/admin/newsletter/issues/{issue_id}")
async def admin_delete_issue(issue_id: str, _: dict = Depends(require_admin)):
    issue_id = validate_uuid(issue_id, "issue_id")
    res = await db["newsletter_issues"].delete_one({"_id": issue_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {"ok": True, "removed": issue_id}


# ============ Admin news CRUD ============
@app.get("/api/admin/news")
async def admin_list_news(_: dict = Depends(require_admin)):
    cursor = db["news"].find({}).sort("date", -1)
    items = []
    async for doc in cursor:
        items.append(_news_doc_to_detail(doc).model_dump())
    return {"count": len(items), "items": items}


@app.post("/api/admin/news")
async def admin_create_news(
    title: str = Form(...),
    summary: str = Form(...),
    tag: str = Form(...),
    date: str = Form(...),
    body_html: str = Form(""),
    cover: UploadFile = File(...),
    gallery: List[UploadFile] = File(default=[]),
    user: dict = Depends(require_admin),
):
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date.strip()):
        raise HTTPException(status_code=400, detail="Date must be YYYY-MM-DD")
    article_id = str(uuid.uuid4())
    cover_image = await _save_news_image(cover, article_id, "cover")
    gallery_names: List[str] = []
    for idx, img in enumerate(gallery or []):
        if img and img.filename:
            gallery_names.append(await _save_news_image(img, article_id, f"g{idx}"))
    doc = {
        "_id": article_id,
        "title": title.strip()[:240],
        "summary": summary.strip()[:800],
        "tag": tag.strip()[:80],
        "date": date.strip(),
        "variant": 1,
        "cover_image": cover_image,
        "body_html": _sanitize_news_html(body_html),
        "gallery": gallery_names,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user.get("email"),
    }
    await db["news"].insert_one(doc)
    return {"ok": True, "id": article_id, "item": _news_doc_to_detail(doc).model_dump()}


@app.put("/api/admin/news/{article_id}")
async def admin_update_news(
    article_id: str,
    title: str = Form(...),
    summary: str = Form(...),
    tag: str = Form(...),
    date: str = Form(...),
    body_html: str = Form(""),
    cover: Optional[UploadFile] = File(None),
    gallery: List[UploadFile] = File(default=[]),
    remove_gallery: Optional[str] = Form(None),
    user: dict = Depends(require_admin),
):
    article_id = validate_uuid(article_id, "article_id")
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date.strip()):
        raise HTTPException(status_code=400, detail="Date must be YYYY-MM-DD")
    existing = await db["news"].find_one({"_id": article_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")

    cover_image = existing.get("cover_image")
    if cover and cover.filename:
        if cover_image:
            try:
                (NEWS_MEDIA_DIR / _safe_news_media_name(cover_image)).unlink(missing_ok=True)
            except HTTPException:
                pass
        cover_image = await _save_news_image(cover, article_id, "cover")

    gallery_names = list(existing.get("gallery") or [])
    if remove_gallery:
        to_remove = [n.strip() for n in remove_gallery.split(",") if n.strip()]
        kept = []
        for name in gallery_names:
            if name in to_remove:
                try:
                    (NEWS_MEDIA_DIR / _safe_news_media_name(name)).unlink(missing_ok=True)
                except HTTPException:
                    pass
            else:
                kept.append(name)
        gallery_names = kept

    for idx, img in enumerate(gallery or []):
        if img and img.filename:
            gallery_names.append(await _save_news_image(img, article_id, f"g{len(gallery_names)}"))

    update = {
        "title": title.strip()[:240],
        "summary": summary.strip()[:800],
        "tag": tag.strip()[:80],
        "date": date.strip(),
        "cover_image": cover_image,
        "body_html": _sanitize_news_html(body_html),
        "gallery": gallery_names,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": user.get("email"),
    }
    await db["news"].update_one({"_id": article_id}, {"$set": update})
    doc = await db["news"].find_one({"_id": article_id})
    return {"ok": True, "id": article_id, "item": _news_doc_to_detail(doc).model_dump()}


@app.delete("/api/admin/news/{article_id}")
async def admin_delete_news(article_id: str, _: dict = Depends(require_admin)):
    article_id = validate_uuid(article_id, "article_id")
    doc = await db["news"].find_one({"_id": article_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Article not found")
    _delete_news_files(doc)
    await db["news"].delete_one({"_id": article_id})
    return {"ok": True, "removed": article_id}


# ============ Admin — édition de contenu site ============
@app.get("/api/admin/content/pages")
async def admin_content_pages(_: dict = Depends(require_admin)):
    """Liste des pages éditables (correspond aux fichiers frontend/i18n/locales/*.json)."""
    return {"items": list_pages()}


@app.get("/api/admin/content")
async def admin_content_list(page: str, lang: str = "fr", _: dict = Depends(require_admin)):
    """Textes d'une page pour une langue (valeur effective = défaut + surcharge éventuelle)."""
    return await get_admin_page_content(db, page, lang)


@app.put("/api/admin/content")
async def admin_content_save(payload: ContentSavePayload, user: dict = Depends(require_admin)):
    """
    Enregistre les modifications de texte.
    Stockage : MongoDB (site_content_overrides) + copie JSON dans backend/data/.
    """
    updates = [u.model_dump() for u in payload.updates]
    return await save_content_updates(db, updates, user["email"])
