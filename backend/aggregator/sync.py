import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

from sqlalchemy.orm import Session

from aggregator.queries import CONSOLE_QUERIES
from aggregator.sources.kleinanzeigen import fetch_kleinanzeigen
from aggregator.sources.marktplaats import fetch_marktplaats_family
from aggregator.sources.vinted import fetch_vinted
from models import Listing, SyncLog

logger = logging.getLogger("retropulse.sync")

PER_QUERY_LIMIT = 8
MAX_WORKERS = 6

FETCHERS = [
    ("Vinted", lambda q, c, b: fetch_vinted(q, c, b, PER_QUERY_LIMIT)),
    ("2ememain", lambda q, c, b: fetch_marktplaats_family("2ememain", q, c, b, PER_QUERY_LIMIT)),
    ("Marktplaats", lambda q, c, b: fetch_marktplaats_family("Marktplaats", q, c, b, PER_QUERY_LIMIT)),
    ("2dehands", lambda q, c, b: fetch_marktplaats_family("2dehands", q, c, b, PER_QUERY_LIMIT)),
    ("Kleinanzeigen", lambda q, c, b: fetch_kleinanzeigen(q, c, b, PER_QUERY_LIMIT)),
]


def _upsert_listing(db: Session, raw, now: datetime) -> bool:
    existing = (
        db.query(Listing)
        .filter(Listing.source == raw.source, Listing.external_id == raw.external_id)
        .first()
    )

    title_en = raw.title
    desc_en = raw.description

    if existing:
        existing.title = raw.title
        existing.title_en = title_en
        existing.description = raw.description
        existing.description_en = desc_en
        existing.console = raw.console
        existing.brand = raw.brand
        existing.price = raw.price
        existing.currency = raw.currency
        existing.location = raw.location
        existing.image_url = raw.image_url
        existing.condition = raw.condition
        existing.is_collectible = raw.is_collectible
        existing.source_url = raw.source_url
        existing.synced_at = now
        db.flush()
        return False

    db.add(
        Listing(
            external_id=raw.external_id,
            source=raw.source,
            source_url=raw.source_url,
            title=raw.title,
            title_en=title_en,
            description=raw.description,
            description_en=desc_en,
            console=raw.console,
            brand=raw.brand,
            listing_type=raw.listing_type,
            condition=raw.condition,
            price=raw.price,
            currency=raw.currency,
            location=raw.location,
            image_url=raw.image_url,
            is_collectible=raw.is_collectible,
            is_featured=raw.is_collectible,
            synced_at=now,
        )
    )
    db.flush()
    return True


def sync_all_listings(db: Session) -> dict:
    now = datetime.utcnow()
    stats = {"added": 0, "updated": 0, "sources": {}, "errors": []}

    tasks = [
        (source_name, item["query"], item["console"], item["brand"], fetcher)
        for source_name, fetcher in FETCHERS
        for item in CONSOLE_QUERIES
    ]

    all_raw: list = []

    def _fetch_task(args):
        source_name, query, console, brand, fetcher = args
        return source_name, fetcher(query, console, brand)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(_fetch_task, t): t[0] for t in tasks}
        for future in as_completed(futures):
            source_name = futures[future]
            try:
                src, listings = future.result()
                all_raw.extend(listings)
            except Exception as exc:
                msg = f"{source_name}: {exc}"
                logger.warning(msg)
                stats["errors"].append(msg)

    seen: set[tuple[str, str]] = set()
    for raw in all_raw:
        key = (raw.source, raw.external_id)
        if key in seen:
            continue
        seen.add(key)
        try:
            is_new = _upsert_listing(db, raw, now)
            if is_new:
                stats["added"] += 1
            else:
                stats["updated"] += 1
            stats["sources"][raw.source] = stats["sources"].get(raw.source, 0) + 1
        except Exception as exc:
            stats["errors"].append(f"{raw.source}/{raw.external_id}: {exc}")

    db.add(
        SyncLog(
            finished_at=now,
            added=stats["added"],
            updated=stats["updated"],
            total=db.query(Listing).count(),
            sources=str(stats["sources"]),
        )
    )
    db.commit()

    stats["total"] = db.query(Listing).count()
    stats["synced_at"] = now.isoformat()
    return stats
