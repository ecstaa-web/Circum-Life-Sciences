"""Unit tests for security validators, rate limiting, and attack scenarios."""
import io
import uuid

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from security import RateLimiter, validate_email_path, validate_upload_magic, validate_uuid
from validators import (
    CareersApplyForm,
    LoginPayload,
    NewsletterSubscribe,
    ResetPasswordPayload,
    SetPasswordPayload,
)


class TestValidateUuid:
    def test_valid_uuid(self):
        uid = str(uuid.uuid4())
        assert validate_uuid(uid) == uid

    def test_rejects_path_traversal(self):
        with pytest.raises(HTTPException) as exc:
            validate_uuid("../../etc/passwd", "application_id")
        assert exc.value.status_code == 400

    def test_rejects_non_uuid(self):
        with pytest.raises(HTTPException):
            validate_uuid("not-a-uuid")


class TestValidateEmailPath:
    def test_valid_email(self):
        assert validate_email_path("Admin@Example.com") == "admin@example.com"

    def test_rejects_injection(self):
        with pytest.raises(HTTPException):
            validate_email_path("admin@example.com/delete")


class TestUploadMagic:
    def test_pdf_header(self):
        validate_upload_magic(b"%PDF-1.4", ".pdf")

    def test_rejects_exe_as_pdf(self):
        with pytest.raises(HTTPException):
            validate_upload_magic(b"MZ\x90\x00", ".pdf")


class TestRateLimiter:
    def test_blocks_after_limit(self):
        rl = RateLimiter()
        for _ in range(3):
            rl.hit("k", 3, 60)
        with pytest.raises(HTTPException) as exc:
            rl.hit("k", 3, 60)
        assert exc.value.status_code == 429


class TestNewsletterSubscribe:
    def test_honeypot_rejected(self):
        with pytest.raises(ValidationError):
            NewsletterSubscribe(
                firstname="A",
                lastname="B",
                email="a@b.com",
                consent=True,
                website="http://spam.bot",
            )

    def test_consent_required_field(self):
        with pytest.raises(ValidationError):
            NewsletterSubscribe(
                firstname="A",
                lastname="B",
                email="a@b.com",
                consent="yes",  # type: ignore[arg-type]
            )


class TestLoginPayload:
    def test_short_password_rejected(self):
        with pytest.raises(ValidationError):
            LoginPayload(email="a@b.com", password="short")

    def test_valid_login(self):
        p = LoginPayload(email="a@b.com", password="ValidPass1")
        assert p.password == "ValidPass1"


class TestPasswordStrength:
    def test_weak_admin_password_rejected(self):
        with pytest.raises(ValidationError):
            SetPasswordPayload(password="weakpassword")

    def test_strong_password_accepted(self):
        p = SetPasswordPayload(password="StrongPass123")
        assert len(p.password) >= 12


class TestCareersForm:
    def test_consent_required(self):
        with pytest.raises(ValueError):
            CareersApplyForm.from_form(
                firstname="Jean",
                lastname="Dupont",
                email="j@example.com",
                phone=None,
                position="Dev",
                location=None,
                experience=None,
                availability=None,
                message=None,
                consent="false",
            )

    def test_honeypot_blocks_spam(self):
        with pytest.raises(ValueError, match="Spam"):
            CareersApplyForm.from_form(
                firstname="Bot",
                lastname="Bot",
                email="bot@spam.com",
                phone=None,
                position="X",
                location=None,
                experience=None,
                availability=None,
                message=None,
                consent="true",
                website="filled",
            )


class TestAttackScenarios:
    """Simulate common abuse patterns at validation layer."""

    def test_malformed_newsletter_payload(self):
        with pytest.raises(ValidationError):
            NewsletterSubscribe(
                firstname="",
                lastname="X",
                email="not-an-email",
                consent=True,
            )

    def test_reset_token_too_short(self):
        with pytest.raises(ValidationError):
            ResetPasswordPayload(token="short", password="StrongPass123")

    def test_id_manipulation_invalid_uuid(self):
        with pytest.raises(HTTPException):
            validate_uuid("00000000-0000-0000-0000-000000000000'; DROP TABLE users;--")

    def test_fake_pdf_upload_header(self):
        with pytest.raises(HTTPException):
            validate_upload_magic(b"<?php echo 1; ?>", ".pdf")
