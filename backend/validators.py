"""Strict request validation (Pydantic v2 — equivalent to Zod on the backend)."""
from __future__ import annotations

import re
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

LANGS = {"fr", "en", "de", "it"}
QUARTERS = {"Q1", "Q2", "Q3", "Q4"}


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


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class SessionExchange(BaseModel):
    session_id: str = Field(min_length=8, max_length=256)

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        if not re.match(r"^[A-Za-z0-9._-]+$", v):
            raise ValueError("Invalid session_id")
        return v


class AllowlistAdd(BaseModel):
    email: EmailStr


class SetPasswordPayload(BaseModel):
    password: str = Field(min_length=12, max_length=200)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v) or not re.search(r"[a-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must include upper, lower, and a digit")
        return v


class ForgotPasswordPayload(BaseModel):
    email: EmailStr


class ResetPasswordPayload(BaseModel):
    token: str = Field(min_length=16, max_length=256)
    password: str = Field(min_length=12, max_length=200)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v) or not re.search(r"[a-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must include upper, lower, and a digit")
        return v


class NewsletterIssueIn(BaseModel):
    quarter: str = Field(min_length=2, max_length=4)
    year: int = Field(ge=2000, le=2100)
    date: str = Field(min_length=8, max_length=32)
    title: str = Field(min_length=1, max_length=240)
    summary: str = Field(min_length=1, max_length=1500)
    link: Optional[str] = Field(default=None, max_length=500)

    @field_validator("quarter")
    @classmethod
    def validate_quarter(cls, v: str) -> str:
        q = v.upper().strip()
        if q not in QUARTERS:
            raise ValueError("Invalid quarter")
        return q

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Date must be YYYY-MM-DD")
        return v

    @field_validator("link")
    @classmethod
    def validate_link(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        link = v.strip()
        if not link.startswith(("http://", "https://")):
            raise ValueError("Link must be http(s)")
        return link


class ContentUpdateItem(BaseModel):
    key: str = Field(min_length=1, max_length=120)
    lang: str = Field(min_length=2, max_length=2)
    value: str = Field(max_length=10000)

    @field_validator("lang")
    @classmethod
    def validate_content_lang(cls, v: str) -> str:
        lang = v.lower()
        if lang not in LANGS:
            raise ValueError("Invalid language")
        return lang

    @field_validator("key")
    @classmethod
    def validate_content_key(cls, v: str) -> str:
        key = v.strip()
        if not re.match(r"^[a-z][a-z0-9_.]{0,119}$", key):
            raise ValueError("Invalid content key")
        return key


class ContentSavePayload(BaseModel):
    updates: list[ContentUpdateItem] = Field(min_length=1, max_length=200)


class ContentRevertItem(BaseModel):
    key: str = Field(min_length=1, max_length=120)
    lang: str = Field(min_length=2, max_length=2)

    @field_validator("lang")
    @classmethod
    def validate_content_lang(cls, v: str) -> str:
        lang = v.lower()
        if lang not in LANGS:
            raise ValueError("Invalid language")
        return lang


class ContentRevertPayload(BaseModel):
    items: list[ContentRevertItem] = Field(min_length=1, max_length=200)


class CmsSeoIn(BaseModel):
    meta_title: Optional[str] = Field(default="", max_length=160)
    meta_description: Optional[str] = Field(default="", max_length=320)
    og_image: Optional[str] = Field(default="", max_length=500)
    robots: Optional[str] = Field(default="index,follow", max_length=40)


class CmsPageCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    slug: str = Field(min_length=1, max_length=80)
    seo: Optional[CmsSeoIn] = None


class CmsPageUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=240)
    slug: Optional[str] = Field(default=None, max_length=80)
    status: Optional[Literal["draft", "published"]] = None
    blocks: Optional[list[dict]] = None
    seo: Optional[CmsSeoIn] = None


class AllowlistAddWithRole(BaseModel):
    email: EmailStr
    role: Literal["admin", "editor"] = "editor"


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
