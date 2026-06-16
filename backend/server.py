import os
import csv
import io
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Response, Cookie, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "/app/backend/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_ADMIN_EMAIL = os.environ.get("DEFAULT_ADMIN_EMAIL", "stag3@circumlifesciences.com").lower()

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_TTL_DAYS = 7

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Circum Life Sciences API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Models ============
class NewsletterSubscribe(BaseModel):
    firstname: str = Field(min_length=1, max_length=80)
    lastname: str = Field(min_length=1, max_length=80)
    email: EmailStr
    company: Optional[str] = None
    role: Optional[str] = None
    lang: Optional[str] = "fr"
    consent: bool = True


class NewsItem(BaseModel):
    id: str
    title: str
    summary: str
    tag: str
    date: str
    variant: int = 1


class SessionExchange(BaseModel):
    session_id: str


class AllowlistAdd(BaseModel):
    email: EmailStr


# ============ Seed ============
SEED_NEWS: List[dict] = [
    {"title": "Inauguration officielle du site Force One", "summary": "Notre site tunisien atteint sa pleine capacité opérationnelle avec 4 cleanrooms ISO 7/8 et 120 opérateurs qualifiés.", "tag": "Inauguration", "date": "2025-10-15", "variant": 1},
    {"title": "Renouvellement ISO 13485 multi-sites", "summary": "Notre système qualité est reconduit sans réserve par l'organisme certificateur. Audit annuel passé sur les trois sites.", "tag": "Certification", "date": "2025-09-22", "variant": 2},
    {"title": "Compamed & Medica Düsseldorf", "summary": "Circum sera présent du 16 au 19 novembre 2026 sur le stand E-23. Réservez votre créneau avec nos équipes commerciales.", "tag": "Salon", "date": "2026-11-17", "variant": 3},
    {"title": "Livre blanc : intégration verticale CDMO", "summary": "Notre équipe publie une analyse de 40 pages sur les bénéfices de l'intégration verticale dans le secteur des dispositifs médicaux.", "tag": "Publication", "date": "2026-03-03", "variant": 4},
    {"title": "Partenariat académique avec l'INSA Lyon", "summary": "Signature d'un partenariat de recherche avec l'INSA Lyon sur les polymères biocompatibles avancés. Trois thèses CIFRE lancées.", "tag": "Partenariat", "date": "2026-01-08", "variant": 5},
    {"title": "Cleanroom C : démarrage de la construction", "summary": "Lancement des travaux d'une nouvelle cleanroom ISO 7 sur le site Force One. Mise en service prévue au troisième trimestre 2026.", "tag": "Investissement", "date": "2025-12-12", "variant": 6},
]


@app.on_event("startup")
async def seed_data():
    coll = db["news"]
    if await coll.count_documents({}) == 0:
        docs = [{"_id": str(uuid.uuid4()), **n, "created_at": datetime.now(timezone.utc).isoformat()} for n in SEED_NEWS]
        await coll.insert_many(docs)
    # Seed admin allow-list with default admin
    if await db["admin_allowlist"].count_documents({}) == 0:
        await db["admin_allowlist"].insert_one({
            "_id": DEFAULT_ADMIN_EMAIL,
            "added_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


# ============ Auth helpers ============
async def _is_allowlisted(email: str) -> bool:
    doc = await db["admin_allowlist"].find_one({"_id": email.lower()})
    return doc is not None


async def _get_session(request: Request, authorization: Optional[str] = None) -> dict:
    """Resolve session_token from cookie or Authorization: Bearer header, validate, return user dict."""
    token = request.cookies.get("session_token")
    if not token and authorization:
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = await db["user_sessions"].find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db["users"].find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    user = await _get_session(request, authorization)
    if not await _is_allowlisted(user["email"]):
        raise HTTPException(status_code=403, detail="Not an admin")
    return user


# ============ Public endpoints ============
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "circum"}


@app.get("/api/news", response_model=List[NewsItem])
async def list_news():
    cursor = db["news"].find({}, {"_id": 1, "title": 1, "summary": 1, "tag": 1, "date": 1, "variant": 1}).sort("date", -1)
    items: List[NewsItem] = []
    async for doc in cursor:
        items.append(NewsItem(id=doc["_id"], title=doc["title"], summary=doc["summary"], tag=doc["tag"], date=doc["date"], variant=int(doc.get("variant", 1))))
    return items


@app.post("/api/newsletter/subscribe")
async def newsletter_subscribe(payload: NewsletterSubscribe):
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
    firstname: str = Form(...),
    lastname: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    position: str = Form(...),
    location: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    availability: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    consent: str = Form("true"),
    cv: UploadFile = File(...),
):
    if consent.lower() not in ("true", "on", "1", "yes"):
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
    with saved_path.open("wb") as out:
        while True:
            chunk = await cv.read(1024 * 64)
            if not chunk:
                break
            written += len(chunk)
            if written > max_bytes:
                out.close()
                saved_path.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="CV too large (max 10 MB)")
            out.write(chunk)

    doc = {
        "_id": app_id,
        "firstname": firstname.strip(),
        "lastname": lastname.strip(),
        "email": email.lower().strip(),
        "phone": (phone or "").strip() or None,
        "position": position.strip(),
        "location": (location or "").strip() or None,
        "experience": (experience or "").strip() or None,
        "availability": (availability or "").strip() or None,
        "message": (message or "").strip() or None,
        "cv_filename": cv.filename,
        "cv_stored": saved_name,
        "cv_size_bytes": written,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db["careers_applications"].insert_one(doc)
    return {"ok": True, "id": app_id}


# ============ Auth endpoints ============
@app.post("/api/auth/google/exchange")
async def auth_exchange(payload: SessionExchange, response: Response):
    """Exchange Emergent session_id (from URL fragment) for our own session cookie."""
    async with httpx.AsyncClient(timeout=10) as http:
        try:
            r = await http.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": payload.session_id})
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Auth provider error: {e}")
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()
    email = (data.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=401, detail="No email returned")

    if not await _is_allowlisted(email):
        # Still 403 — UI must show "access denied" without storing anything.
        raise HTTPException(status_code=403, detail=f"Email not in admin allow-list: {email}")

    # Upsert user
    existing = await db["users"].find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db["users"].update_one({"user_id": user_id}, {"$set": {"name": data.get("name"), "picture": data.get("picture"), "updated_at": datetime.now(timezone.utc).isoformat()}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db["users"].insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name"),
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Create session
    session_token = data.get("session_token") or uuid.uuid4().hex
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    await db["user_sessions"].insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })

    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=SESSION_TTL_DAYS * 24 * 3600,
    )
    return {"ok": True, "user": {"user_id": user_id, "email": email, "name": data.get("name"), "picture": data.get("picture")}}


@app.get("/api/auth/me")
async def auth_me(request: Request, authorization: Optional[str] = Header(None)):
    user = await _get_session(request, authorization)
    return {"user_id": user["user_id"], "email": user["email"], "name": user.get("name"), "picture": user.get("picture")}


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


@app.get("/api/careers/cv/{application_id}")
async def download_cv(application_id: str, _: dict = Depends(require_admin)):
    doc = await db["careers_applications"].find_one({"_id": application_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    path = UPLOAD_DIR / doc["cv_stored"]
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing")
    return FileResponse(path, filename=doc.get("cv_filename") or path.name)


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
    existing = await db["admin_allowlist"].find_one({"_id": email})
    if existing:
        return {"ok": True, "already_present": True}
    await db["admin_allowlist"].insert_one({
        "_id": email,
        "added_by": user["email"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True, "email": email}


@app.delete("/api/admin/allowlist/{email}")
async def allowlist_remove(email: str, user: dict = Depends(require_admin)):
    email = email.lower()
    total = await db["admin_allowlist"].count_documents({})
    if total <= 1:
        raise HTTPException(status_code=400, detail="At least one admin must remain")
    if email == user["email"]:
        raise HTTPException(status_code=400, detail="You cannot remove yourself")
    res = await db["admin_allowlist"].delete_one({"_id": email})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Email not in allow-list")
    return {"ok": True, "removed": email}
