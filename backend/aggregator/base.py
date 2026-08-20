from dataclasses import dataclass
from datetime import datetime


@dataclass
class RawListing:
    external_id: str
    source: str
    source_url: str
    title: str
    description: str
    console: str
    brand: str
    price: float
    currency: str
    location: str
    image_url: str
    condition: str
    is_collectible: bool = False
    listing_type: str = "sell"
    posted_at: datetime | None = None
