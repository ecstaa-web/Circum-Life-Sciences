import os
import csv
import io
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Response, Header, Depends
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
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Stag3Admin2026!")

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_TTL_DAYS = 7
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

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


# ============ Helpers ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


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


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class SetPasswordPayload(BaseModel):
    password: str = Field(min_length=8, max_length=200)


class NewsletterIssueIn(BaseModel):
    quarter: str = Field(min_length=2, max_length=4)  # Q1, Q2, Q3, Q4
    year: int = Field(ge=2000, le=2100)
    date: str  # ISO date (e.g. "2026-03-01")
    title: str = Field(min_length=1, max_length=240)
    summary: str = Field(min_length=1, max_length=1500)
    link: Optional[str] = None


# ============ Seed ============
SEED_NEWS: List[dict] = [
    {"title": "Inauguration officielle du site Force One", "summary": "Notre site tunisien atteint sa pleine capacité opérationnelle avec 4 cleanrooms ISO 7/8 et 120 opérateurs qualifiés.", "tag": "Inauguration", "date": "2025-10-15", "variant": 1},
    {"title": "Renouvellement ISO 13485 multi-sites", "summary": "Notre système qualité est reconduit sans réserve par l'organisme certificateur. Audit annuel passé sur les trois sites.", "tag": "Certification", "date": "2025-09-22", "variant": 2},
    {"title": "Compamed & Medica Düsseldorf", "summary": "Circum sera présent du 16 au 19 novembre 2026 sur le stand E-23. Réservez votre créneau avec nos équipes commerciales.", "tag": "Salon", "date": "2026-11-17", "variant": 3},
    {"title": "Livre blanc : intégration verticale CDMO", "summary": "Notre équipe publie une analyse de 40 pages sur les bénéfices de l'intégration verticale dans le secteur des dispositifs médicaux.", "tag": "Publication", "date": "2026-03-03", "variant": 4},
    {"title": "Partenariat académique avec l'INSA Lyon", "summary": "Signature d'un partenariat de recherche avec l'INSA Lyon sur les polymères biocompatibles avancés. Trois thèses CIFRE lancées.", "tag": "Partenariat", "date": "2026-01-08", "variant": 5},
    {"title": "Cleanroom C : démarrage de la construction", "summary": "Lancement des travaux d'une nouvelle cleanroom ISO 7 sur le site Force One. Mise en service prévue au troisième trimestre 2026.", "tag": "Investissement", "date": "2025-12-12", "variant": 6},
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
        docs = [{"_id": str(uuid.uuid4()), **n, "created_at": datetime.now(timezone.utc).isoformat()} for n in SEED_NEWS]
        await db["news"].insert_many(docs)

    # Newsletter issues
    if await db["newsletter_issues"].count_documents({}) == 0:
        docs = [{"_id": str(uuid.uuid4()), **n, "created_at": datetime.now(timezone.utc).isoformat()} for n in SEED_NEWSLETTER_ISSUES]
        await db["newsletter_issues"].insert_many(docs)

    # Admin allow-list
    if await db["admin_allowlist"].count_documents({}) == 0:
        await db["admin_allowlist"].insert_one({
            "_id": DEFAULT_ADMIN_EMAIL,
            "added_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Seed admin user with password (idempotent — update hash only if env password changed)
    existing = await db["users"].find_one({"email": DEFAULT_ADMIN_EMAIL})
    if existing is None:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db["users"].insert_one({
            "user_id": user_id,
            "email": DEFAULT_ADMIN_EMAIL,
            "name": "Admin Circum",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "auth_methods": ["password"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        # Ensure password is set and matches current env (re-hash if changed)
        if not existing.get("password_hash") or not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
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
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db["users"].find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(request: Request, authorization: Optional[str] = Header(None)) -> dict:
    user = await _get_session(request, authorization)
    if not await _is_allowlisted(user["email"]):
        raise HTTPException(status_code=403, detail="Not an admin")
    return user


def _set_session_cookie(response: Response, session_token: str):
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=SESSION_TTL_DAYS * 24 * 3600,
    )


async def _create_session(user_id: str) -> str:
    token = uuid.uuid4().hex + uuid.uuid4().hex
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    await db["user_sessions"].insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })
    return token


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
    cursor = db["news"].find({}, {"_id": 1, "title": 1, "summary": 1, "tag": 1, "date": 1, "variant": 1}).sort("date", -1)
    items: List[NewsItem] = []
    async for doc in cursor:
        items.append(NewsItem(id=doc["_id"], title=doc["title"], summary=doc["summary"], tag=doc["tag"], date=doc["date"], variant=int(doc.get("variant", 1))))
    return items


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
@app.post("/api/auth/login")
async def auth_login(payload: LoginPayload, request: Request, response: Response):
    email = payload.email.lower()
    ip = (request.client.host if request.client else "unknown")

    await _check_brute_force(email, ip)

    user = await db["users"].find_one({"email": email})
    if not user or not user.get("password_hash"):
        await _record_failed_login(email, ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload.password, user["password_hash"]):
        await _record_failed_login(email, ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not await _is_allowlisted(email):
        raise HTTPException(status_code=403, detail=f"Email not in admin allow-list: {email}")

    await _clear_failed_login(email, ip)
    token = await _create_session(user["user_id"])
    _set_session_cookie(response, token)
    return {"ok": True, "user": {"user_id": user["user_id"], "email": email, "name": user.get("name"), "picture": user.get("picture")}}


@app.post("/api/auth/google/exchange")
async def auth_exchange(payload: SessionExchange, response: Response):
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
        raise HTTPException(status_code=403, detail=f"Email not in admin allow-list: {email}")

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

    session_token = data.get("session_token") or (uuid.uuid4().hex + uuid.uuid4().hex)
    await db["user_sessions"].insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS),
        "created_at": datetime.now(timezone.utc),
    })
    _set_session_cookie(response, session_token)
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


@app.delete("/api/admin/leads/{lead_id}")
async def admin_delete_lead(lead_id: str, _: dict = Depends(require_admin)):
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
    if await db["admin_allowlist"].find_one({"_id": email}):
        return {"ok": True, "already_present": True}
    await db["admin_allowlist"].insert_one({
        "_id": email, "added_by": user["email"],
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


@app.put("/api/admin/allowlist/{email}/password")
async def allowlist_set_password(email: str, payload: SetPasswordPayload, user: dict = Depends(require_admin)):
    """Set or change the password for an admin in the allow-list.

    - If the user does not yet exist (admin added to allow-list but never logged in), create them.
    - Otherwise update the password_hash.
    """
    email = email.lower()
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
    res = await db["newsletter_issues"].delete_one({"_id": issue_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {"ok": True, "removed": issue_id}
