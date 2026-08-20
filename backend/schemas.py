from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    plan: str

    model_config = {"from_attributes": True}


class ListingCreate(BaseModel):
    title: str
    title_en: str
    description: str
    description_en: str
    console: str
    brand: str
    listing_type: str
    condition: str
    price: float
    currency: str = "EUR"
    location: str
    image_url: str
    is_collectible: bool = False


class ListingOut(BaseModel):
    id: int
    title: str
    title_en: str
    description: str
    description_en: str
    console: str
    brand: str
    listing_type: str
    condition: str
    price: float
    currency: str
    location: str
    image_url: str
    is_collectible: bool
    is_featured: bool
    source: str
    owner_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertCreate(BaseModel):
    console: str
    max_price: float
    listing_type: str = "sell"


class AlertOut(BaseModel):
    id: int
    console: str
    max_price: float
    listing_type: str
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StatsOut(BaseModel):
    total_listings: int
    total_consoles: int
    avg_price: float
    new_today: int
    collectors_items: int
