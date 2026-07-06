"""Strict request validation (Pydantic v2 — equivalent to Zod on the backend)."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

LANGS = {"fr", "en", "de", "it"}


def _strip_text(value: str, max_len: int) -> str:
    cleaned = " ".join(value.split())
    if not cleaned:
        raise ValueError("Required field")
    if len(cleaned) > max_len:
        raise ValueError("Value too long")
    return cleaned


class NewsletterSubscribe(BaseModel):
    firstname: str = Field(min_length=1, max_length=80)
    lastname: str = Field(min_length=1, max_length=80)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=120)
    role: Optional[str] = Field(default=None, max_length=120)
    lang: Optional[str] = "fr"
    consent: bool
    website: Optional[str] = Field(default=None, max_length=0)  # honeypot

    @field_validator("firstname", "lastname")
    @classmethod
    def validate_names(cls, v: str) -> str:
        return _strip_text(v, 80)

    @field_validator("lang")
    @classmethod
    def validate_lang(cls, v: Optional[str]) -> str:
        lang = (v or "fr").lower()
        if lang not in LANGS:
            raise ValueError("Invalid language")
        return lang

    @field_validator("website")
    @classmethod
    def honeypot_empty(cls, v: Optional[str]) -> Optional[str]:
        if v:
            raise ValueError("Spam detected")
        return v


class ContactSubmitForm(BaseModel):
    firstname: str
    lastname: str
    email: EmailStr
    phone: Optional[str] = None
    company: str
    role: Optional[str] = None
    country: str
    size: Optional[str] = None
    contact_type: str
    device_class: Optional[str] = None
    stage: Optional[str] = None
    volume: Optional[str] = None
    timeline: Optional[str] = None
    message: str
    lang: str = "fr"
    consent: bool
    website: Optional[str] = None

    @classmethod
    def from_form(
        cls,
        *,
        firstname: str,
        lastname: str,
        email: str,
        phone: Optional[str],
        company: str,
        role: Optional[str],
        country: str,
        size: Optional[str],
        contact_type: str,
        device_class: Optional[str],
        stage: Optional[str],
        volume: Optional[str],
        timeline: Optional[str],
        message: str,
        lang: Optional[str],
        consent: str,
        website: Optional[str] = None,
    ) -> "ContactSubmitForm":
        if website and website.strip():
            raise ValueError("Spam detected")
        consent_ok = consent.lower() in ("true", "on", "1", "yes")
        lang_code = (lang or "fr").lower()
        if lang_code not in LANGS:
            lang_code = "fr"
        return cls(
            firstname=_strip_text(firstname, 80),
            lastname=_strip_text(lastname, 80),
            email=email.strip().lower(),
            phone=(phone or "").strip()[:40] or None,
            company=_strip_text(company, 160),
            role=(role or "").strip()[:120] or None,
            country=_strip_text(country, 80),
            size=(size or "").strip()[:80] or None,
            contact_type=_strip_text(contact_type, 120),
            device_class=(device_class or "").strip()[:80] or None,
            stage=(stage or "").strip()[:80] or None,
            volume=(volume or "").strip()[:80] or None,
            timeline=(timeline or "").strip()[:80] or None,
            message=(message or "").strip()[:5000],
            lang=lang_code,
            consent=consent_ok,
            website=website,
        )


class CareersApplyForm(BaseModel):
    firstname: str
    lastname: str
    email: EmailStr
    phone: Optional[str] = None
    position: str
    location: Optional[str] = None
    experience: Optional[str] = None
    availability: Optional[str] = None
    message: Optional[str] = None
    consent: bool
    website: Optional[str] = None

    @classmethod
    def from_form(
        cls,
        *,
        firstname: str,
        lastname: str,
        email: str,
        phone: Optional[str],
        position: str,
        location: Optional[str],
        experience: Optional[str],
        availability: Optional[str],
        message: Optional[str],
        consent: str,
        website: Optional[str] = None,
    ) -> "CareersApplyForm":
        if website and website.strip():
            raise ValueError("Spam detected")
        consent_ok = consent.lower() in ("true", "on", "1", "yes")
        return cls(
            firstname=_strip_text(firstname, 80),
            lastname=_strip_text(lastname, 80),
            email=email.strip().lower(),
            phone=(phone or "").strip()[:40] or None,
            position=_strip_text(position, 120),
            location=(location or "").strip()[:120] or None,
            experience=(experience or "").strip()[:80] or None,
            availability=(availability or "").strip()[:80] or None,
            message=(message or "").strip()[:3000] or None,
            consent=consent_ok,
            website=website,
        )
