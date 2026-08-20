from models import Alert, Listing, User
from aggregator.sync import sync_all_listings


def seed_database(db):
    if db.query(User).count() == 0:
        demo_user = User(
            email="demo@retropulse.io",
            name="Alex Collector",
            password="demo123",
            plan="pro",
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        db.add(Alert(user_id=demo_user.id, console="Nintendo 64", max_price=400.0, listing_type="sell"))
        db.add(Alert(user_id=demo_user.id, console="Dreamcast", max_price=200.0, listing_type="sell"))
        db.commit()

    if db.query(Listing).count() == 0:
        sync_all_listings(db)
