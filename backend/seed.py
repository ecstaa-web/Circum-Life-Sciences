from models import Alert, Listing, User
from aggregator.sync import sync_all_listings

DEMO_EMAIL = "demo@retropulse.io"
DEMO_PASSWORD = "demo123"


def ensure_demo_user(db) -> User:
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if user:
        user.password = DEMO_PASSWORD
        user.plan = "pro"
        db.commit()
        return user

    user = User(
        email=DEMO_EMAIL,
        name="Alex Collector",
        password=DEMO_PASSWORD,
        plan="pro",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if db.query(Alert).filter(Alert.user_id == user.id).count() == 0:
        db.add(Alert(user_id=user.id, console="Nintendo 64", max_price=400.0, listing_type="sell"))
        db.add(Alert(user_id=user.id, console="Dreamcast", max_price=200.0, listing_type="sell"))
        db.commit()

    return user


def seed_database(db):
    ensure_demo_user(db)

    if db.query(Listing).count() == 0:
        sync_all_listings(db)
