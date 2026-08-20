import threading
from datetime import datetime, timedelta
from typing import Optional

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from aggregator.sync import sync_all_listings
from database import Base, engine, get_db
from models import Alert, Listing, SyncLog, User, WatchlistItem
from schemas import (
    AlertCreate,
    AlertOut,
    ListingCreate,
    ListingOut,
    StatsOut,
    SyncOut,
    UserCreate,
    UserLogin,
    UserOut,
)
from seed import seed_database

app = FastAPI(title="RetroPulse API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_sync_lock = threading.Lock()
_sync_running = False

Base.metadata.create_all(bind=engine)


def _run_sync():
    global _sync_running
    with _sync_lock:
        if _sync_running:
            return
        _sync_running = True
    try:
        db = next(get_db())
        seed_database(db)
        sync_all_listings(db)
    finally:
        _sync_running = False


@app.on_event("startup")
def startup():
    db = next(get_db())
    seed_database(db)
    total = db.query(Listing).count()
    last = db.query(SyncLog).order_by(SyncLog.finished_at.desc()).first()
    stale = not last or (datetime.utcnow() - last.finished_at) > timedelta(hours=6)
    if total < 20 or stale:
        threading.Thread(target=_run_sync, daemon=True).start()


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "retropulse", "version": "2.0.0"}


@app.get("/api/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Listing).count()
    consoles = db.query(Listing.console).distinct().count()
    avg = db.query(func.avg(Listing.price)).scalar() or 0
    today = datetime.utcnow() - timedelta(hours=24)
    new_today = db.query(Listing).filter(Listing.synced_at >= today).count()
    collectors = db.query(Listing).filter(Listing.is_collectible.is_(True)).count()
    last_sync = db.query(SyncLog).order_by(SyncLog.finished_at.desc()).first()
    sources = [row[0] for row in db.query(Listing.source).distinct().all()]
    return StatsOut(
        total_listings=total,
        total_consoles=consoles,
        avg_price=round(float(avg), 2),
        new_today=new_today,
        collectors_items=collectors,
        last_sync=last_sync.finished_at if last_sync else None,
        sources_active=sources,
    )


@app.post("/api/sync", response_model=SyncOut)
def trigger_sync(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    global _sync_running
    if _sync_running:
        raise HTTPException(status_code=409, detail="Sync already in progress")
    stats = sync_all_listings(db)
    return SyncOut(**stats)


@app.get("/api/listings", response_model=list[ListingOut])
def get_listings(
    console: Optional[str] = None,
    brand: Optional[str] = None,
    listing_type: Optional[str] = None,
    condition: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    collectible: Optional[bool] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    source: Optional[str] = None,
    sort: str = Query(default="newest"),
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Listing)

    if console:
        query = query.filter(Listing.console.ilike(f"%{console}%"))
    if brand:
        query = query.filter(Listing.brand.ilike(f"%{brand}%"))
    if listing_type:
        query = query.filter(Listing.listing_type == listing_type)
    if condition:
        query = query.filter(Listing.condition.ilike(f"%{condition}%"))
    if min_price is not None:
        query = query.filter(Listing.price >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)
    if collectible is not None:
        query = query.filter(Listing.is_collectible.is_(collectible))
    if featured is not None:
        query = query.filter(Listing.is_featured.is_(featured))
    if source:
        query = query.filter(Listing.source.ilike(f"%{source}%"))
    if search:
        term = f"%{search}%"
        query = query.filter(
            (Listing.title.ilike(term))
            | (Listing.title_en.ilike(term))
            | (Listing.console.ilike(term))
            | (Listing.description.ilike(term))
        )

    if sort == "price_asc":
        query = query.order_by(Listing.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Listing.price.desc())
    else:
        query = query.order_by(Listing.synced_at.desc(), Listing.created_at.desc())

    return query.limit(limit).all()


@app.get("/api/listings/{listing_id}", response_model=ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@app.post("/api/listings", response_model=ListingOut)
def create_listing(payload: ListingCreate, db: Session = Depends(get_db)):
    import uuid

    listing = Listing(
        **payload.model_dump(),
        external_id=f"user-{uuid.uuid4().hex[:12]}",
        source="RetroPulse",
        source_url="",
        owner_id=1,
        synced_at=datetime.utcnow(),
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@app.get("/api/consoles")
def get_consoles(db: Session = Depends(get_db)):
    rows = db.query(Listing.console, func.count(Listing.id)).group_by(Listing.console).all()
    return [{"name": name, "count": count} for name, count in rows]


@app.get("/api/brands")
def get_brands(db: Session = Depends(get_db)):
    rows = db.query(Listing.brand, func.count(Listing.id)).group_by(Listing.brand).all()
    return [{"name": name, "count": count} for name, count in rows]


@app.get("/api/sources")
def get_sources(db: Session = Depends(get_db)):
    rows = db.query(Listing.source, func.count(Listing.id)).group_by(Listing.source).all()
    return [{"name": name, "count": count} for name, count in rows]


@app.post("/api/auth/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, name=payload.name, password=payload.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/auth/login", response_model=UserOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


@app.get("/api/alerts", response_model=list[AlertOut])
def get_alerts(user_id: int = 1, db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.user_id == user_id).all()


@app.post("/api/alerts", response_model=AlertOut)
def create_alert(payload: AlertCreate, user_id: int = 1, db: Session = Depends(get_db)):
    alert = Alert(user_id=user_id, **payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@app.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"ok": True}


@app.post("/api/watchlist/{listing_id}")
def add_to_watchlist(listing_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    existing = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user_id, WatchlistItem.listing_id == listing_id)
        .first()
    )
    if existing:
        return {"ok": True, "message": "Already in watchlist"}
    item = WatchlistItem(user_id=user_id, listing_id=listing_id)
    db.add(item)
    db.commit()
    return {"ok": True}


@app.get("/api/watchlist", response_model=list[ListingOut])
def get_watchlist(user_id: int = 1, db: Session = Depends(get_db)):
    items = db.query(WatchlistItem).filter(WatchlistItem.user_id == user_id).all()
    ids = [item.listing_id for item in items]
    if not ids:
        return []
    return db.query(Listing).filter(Listing.id.in_(ids)).all()
