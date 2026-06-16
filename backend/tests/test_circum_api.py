"""
Backend tests for Circum API:
- health, news (seeded), newsletter/subscribe, careers/apply
"""
import io
import uuid
import pytest
import requests

BASE_URL = "https://b709274e-5200-48ec-baa8-751e87349ea7.preview.emergentagent.com"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ---------- Health ----------
def test_health(s):
    r = s.get(f"{BASE_URL}/api/health", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    assert data.get("service") == "circum"


# ---------- News ----------
def test_news_list_returns_six_items(s):
    r = s.get(f"{BASE_URL}/api/news", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) == 6
    # Schema check
    for it in items:
        for k in ("id", "title", "summary", "tag", "date", "variant"):
            assert k in it, f"Missing key {k}"
        assert isinstance(it["id"], str)
        assert isinstance(it["title"], str) and len(it["title"]) > 0
        assert isinstance(it["variant"], int)


def test_news_includes_expected_titles(s):
    r = s.get(f"{BASE_URL}/api/news", timeout=15)
    titles = [it["title"] for it in r.json()]
    assert "Compamed & Medica Düsseldorf" in titles
    assert "Inauguration officielle du site Force One" in titles
    assert "Renouvellement ISO 13485 multi-sites" in titles


# ---------- Newsletter ----------
def test_newsletter_subscribe_success_and_idempotent(s):
    email = f"TEST_nl_{uuid.uuid4().hex[:10]}@example.com"
    payload = {
        "firstname": "TEST",
        "lastname": "User",
        "email": email,
        "company": "Acme",
        "role": "QA",
        "lang": "fr",
        "consent": True,
    }
    r1 = s.post(f"{BASE_URL}/api/newsletter/subscribe", json=payload, timeout=15)
    assert r1.status_code == 200, r1.text
    d1 = r1.json()
    assert d1.get("ok") is True
    assert "id" in d1
    assert d1.get("already_subscribed") is not True

    # Second submit with same email -> already_subscribed
    r2 = s.post(f"{BASE_URL}/api/newsletter/subscribe", json=payload, timeout=15)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2.get("ok") is True
    assert d2.get("already_subscribed") is True


def test_newsletter_subscribe_rejects_no_consent(s):
    payload = {
        "firstname": "TEST",
        "lastname": "NoConsent",
        "email": f"TEST_nc_{uuid.uuid4().hex[:8]}@example.com",
        "consent": False,
    }
    r = s.post(f"{BASE_URL}/api/newsletter/subscribe", json=payload, timeout=15)
    assert r.status_code == 400


def test_newsletter_subscribe_rejects_invalid_email(s):
    payload = {
        "firstname": "TEST",
        "lastname": "Bad",
        "email": "not-an-email",
        "consent": True,
    }
    r = s.post(f"{BASE_URL}/api/newsletter/subscribe", json=payload, timeout=15)
    assert r.status_code in (400, 422)


# ---------- Careers ----------
def _pdf_bytes():
    # Minimal valid-ish pdf header so server doesn't need to parse
    return b"%PDF-1.4\n%TEST circum CV\n%%EOF"


def test_careers_apply_success_pdf(s):
    files = {"cv": ("test_cv.pdf", io.BytesIO(_pdf_bytes()), "application/pdf")}
    data = {
        "firstname": "TEST",
        "lastname": "Candidat",
        "email": f"TEST_c_{uuid.uuid4().hex[:8]}@example.com",
        "phone": "+33600000000",
        "position": "Candidature spontanée",
        "location": "Lyon · France",
        "experience": "3 à 5 ans",
        "availability": "Immédiate",
        "message": "Test message",
        "consent": "true",
    }
    r = s.post(f"{BASE_URL}/api/careers/apply", data=data, files=files, timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True
    assert "id" in body and isinstance(body["id"], str)


def test_careers_apply_rejects_txt(s):
    files = {"cv": ("bad.txt", io.BytesIO(b"hello"), "text/plain")}
    data = {
        "firstname": "TEST",
        "lastname": "BadExt",
        "email": f"TEST_bad_{uuid.uuid4().hex[:6]}@example.com",
        "position": "Candidature spontanée",
        "consent": "true",
    }
    r = s.post(f"{BASE_URL}/api/careers/apply", data=data, files=files, timeout=15)
    assert r.status_code == 400


def test_careers_apply_rejects_no_consent(s):
    files = {"cv": ("ok.pdf", io.BytesIO(_pdf_bytes()), "application/pdf")}
    data = {
        "firstname": "TEST",
        "lastname": "NoConsent",
        "email": f"TEST_nc_{uuid.uuid4().hex[:6]}@example.com",
        "position": "Candidature spontanée",
        "consent": "false",
    }
    r = s.post(f"{BASE_URL}/api/careers/apply", data=data, files=files, timeout=15)
    assert r.status_code == 400
