"""Security middleware, rate limiting, and helpers for the Circum API."""
from __future__ import annotations

import logging
import os
import re
import time
import uuid
from collections import defaultdict
from typing import Callable, Optional

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("circum.security")

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.I,
)

# Magic bytes for allowed CV uploads
FILE_SIGNATURES: dict[str, list[bytes]] = {
    ".pdf": [b"%PDF"],
    ".doc": [b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"],
    ".docx": [b"PK\x03\x04"],
}

IMAGE_SIGNATURES: dict[str, list[bytes]] = {
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".webp": [b"RIFF"],
}


def validate_image_magic(header: bytes, ext: str) -> None:
    ext = ext.lower()
    if ext == ".webp":
        if len(header) < 12 or header[:4] != b"RIFF" or header[8:12] != b"WEBP":
            raise HTTPException(status_code=400, detail="Invalid WebP image")
        return
    signatures = IMAGE_SIGNATURES.get(ext)
    if not signatures:
        raise HTTPException(status_code=400, detail="Invalid image type")
    if not any(header.startswith(sig) for sig in signatures):
        raise HTTPException(status_code=400, detail="File content does not match extension")


class RateLimiter:
    """In-memory sliding-window rate limiter (per process)."""

    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)

    def hit(self, key: str, max_hits: int, window_seconds: int) -> None:
        now = time.time()
        window_start = now - window_seconds
        hits = [t for t in self._hits[key] if t > window_start]
        if len(hits) >= max_hits:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
        hits.append(now)
        self._hits[key] = hits


rate_limiter = RateLimiter()


def get_environment() -> str:
    return os.environ.get("ENVIRONMENT", "development").lower()


def is_production() -> bool:
    return get_environment() == "production"


def get_client_ip(request: Request) -> str:
    trust_proxy = os.environ.get("TRUST_PROXY", "false").lower() in ("1", "true", "yes")
    if trust_proxy:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def rate_limit(key: str, max_hits: int, window_seconds: int) -> None:
    rate_limiter.hit(key, max_hits, window_seconds)


def validate_uuid(value: str, field_name: str = "id") -> str:
    if not value or not UUID_RE.match(value.strip()):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    return value.strip()


def validate_email_path(value: str) -> str:
    email = value.strip().lower()
    if not email or "@" not in email or len(email) > 254:
        raise HTTPException(status_code=400, detail="Invalid email")
    return email


def validate_upload_magic(header: bytes, ext: str) -> None:
    signatures = FILE_SIGNATURES.get(ext)
    if not signatures:
        raise HTTPException(status_code=400, detail="Invalid file type")
    if not any(header.startswith(sig) for sig in signatures):
        raise HTTPException(status_code=400, detail="File content does not match extension")


def parse_allowed_origins() -> list[str]:
    raw = os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
    )
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or ["http://localhost:3000"]


def cookie_settings() -> dict:
    samesite = os.environ.get("COOKIE_SAMESITE", "lax").lower()
    if samesite not in ("lax", "strict", "none"):
        samesite = "lax"
    secure_env = os.environ.get("COOKIE_SECURE", "true" if is_production() else "false").lower()
    secure = secure_env in ("1", "true", "yes")
    if samesite == "none" and not secure:
        secure = True
    return {"secure": secure, "samesite": samesite}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        response: Response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("X-XSS-Protection", "0")
        if is_production():
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=63072000; includeSubDomains; preload",
            )
        csp = os.environ.get(
            "CONTENT_SECURITY_POLICY",
            "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
        )
        response.headers.setdefault("Content-Security-Policy", csp)
        if "server" in response.headers:
            del response.headers["server"]
        return response


def require_admin_csrf(request: Request) -> None:
    """Block simple cross-site form posts to cookie-authenticated admin API."""
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    token = request.headers.get("x-circum-csrf")
    if not token or len(token) < 8:
        raise HTTPException(status_code=403, detail="Forbidden")


def safe_error_detail(public: str, internal: Optional[str] = None) -> str:
    if internal:
        logger.warning(internal)
    return public
