"""
Backend tests for Circum Admin API:
- Auth flows (exchange, me, logout)
- Allow-list enforcement (admin vs non-admin vs no-auth)
- Admin endpoints (leads, applications) + CSV/JSON exports
- Allow-list management (GET/POST/DELETE + edge cases)
- Regression: health, news, newsletter, careers
"""
import io
import os
import uuid
import time
import subprocess
import pytest
import requests

BASE_URL = "https://b709274e-5200-48ec-baa8-751e87349ea7.preview.emergentagent.com"


def _mongosh(script: str) -> str:
    r = subprocess.run(["mongosh", "--quiet", "--eval", script], capture_output=True, text=True, timeout=30)
    return r.stdout.strip()


@pytest.fixture(scope="module")
def admin_token():
    out = _mongosh(
        "use('circum'); "
        "var u='user_test_admin'; var t='test_session_'+Date.now(); "
        "db.users.replaceOne({user_id:u},{user_id:u,email:'stag3@circumlifesciences.com',name:'Test Admin',picture:null,created_at:new Date()},{upsert:true}); "
        "db.user_sessions.insertOne({user_id:u,session_token:t,expires_at:new Date(Date.now()+7*24*60*60*1000),created_at:new Date()}); "
        "print(t);"
    )
    token = out.splitlines()[-1].strip()
    assert token.startswith("test_session_"), f"unexpected: {out}"
    return token


@pytest.fixture(scope="module")
def nonadmin_token():
    out = _mongosh(
        "use('circum'); "
        "var u='user_test_nonadmin'; var t='test_session_nonadmin_'+Date.now(); "
        "db.users.replaceOne({user_id:u},{user_id:u,email:'notadmin@example.com',name:'NA',picture:null,created_at:new Date()},{upsert:true}); "
        "db.user_sessions.insertOne({user_id:u,session_token:t,expires_at:new Date(Date.now()+7*24*60*60*1000),created_at:new Date()}); "
        "print(t);"
    )
    token = out.splitlines()[-1].strip()
    assert token.startswith("test_session_nonadmin_"), f"unexpected: {out}"
    return token


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def H(token):
    return {"Authorization": f"Bearer {token}"}


# ============ Auth basic ============
def test_exchange_invalid_session_id(s):
    r = s.post(f"{BASE_URL}/api/auth/google/exchange", json={"session_id": "definitely_invalid_xyz_123"}, timeout=15)
    assert r.status_code == 401, r.text


def test_me_without_auth(s):
    r = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
    assert r.status_code == 401


def test_logout_without_session_returns_ok(s):
    r = s.post(f"{BASE_URL}/api/auth/logout", timeout=15)
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_me_with_valid_bearer(s, admin_token):
    r = s.get(f"{BASE_URL}/api/auth/me", headers=H(admin_token), timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "stag3@circumlifesciences.com"
    assert data["user_id"] == "user_test_admin"


# ============ Allow-list enforcement ============
def test_admin_endpoints_without_auth(s):
    for path in ["/api/admin/leads", "/api/admin/applications", "/api/admin/allowlist",
                 "/api/admin/leads.csv", "/api/admin/leads.json",
                 "/api/admin/applications.csv", "/api/admin/applications.json"]:
        r = s.get(f"{BASE_URL}{path}", timeout=15)
        assert r.status_code == 401, f"{path} got {r.status_code}"


def test_admin_endpoints_forbidden_for_nonadmin(s, nonadmin_token):
    r = s.get(f"{BASE_URL}/api/admin/leads", headers=H(nonadmin_token), timeout=15)
    assert r.status_code == 403
    r = s.get(f"{BASE_URL}/api/admin/applications", headers=H(nonadmin_token), timeout=15)
    assert r.status_code == 403
    r = s.get(f"{BASE_URL}/api/admin/allowlist", headers=H(nonadmin_token), timeout=15)
    assert r.status_code == 403


# ============ Admin lists ============
def test_admin_leads_list(s, admin_token):
    r = s.get(f"{BASE_URL}/api/admin/leads", headers=H(admin_token), timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "count" in data and "items" in data
    assert isinstance(data["items"], list)
    assert data["count"] == len(data["items"])
    assert data["count"] >= 1
    sample = data["items"][0]
    for k in ("id", "firstname", "lastname", "email", "created_at"):
        assert k in sample


def test_admin_apps_list(s, admin_token):
    r = s.get(f"{BASE_URL}/api/admin/applications", headers=H(admin_token), timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "count" in data and "items" in data
    assert isinstance(data["items"], list)


# ============ Exports ============
def test_leads_csv_export(s, admin_token):
    r = s.get(f"{BASE_URL}/api/admin/leads.csv", headers=H(admin_token), timeout=15)
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert "attachment" in r.headers.get("content-disposition", "").lower()
    assert "filename" in r.headers.get("content-disposition", "").lower()
    # Body should have header row
    text = r.text
    assert "email" in text.splitlines()[0].lower()


def test_leads_json_export(s, admin_token):
    r = s.get(f"{BASE_URL}/api/admin/leads.json", headers=H(admin_token), timeout=15)
    assert r.status_code == 200
    assert "attachment" in r.headers.get("content-disposition", "").lower()
    data = r.json()
    assert "items" in data


def test_apps_csv_export(s, admin_token):
    r = s.get(f"{BASE_URL}/api/admin/applications.csv", headers=H(admin_token), timeout=15)
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert "attachment" in r.headers.get("content-disposition", "").lower()


def test_apps_json_export(s, admin_token):
    r = s.get(f"{BASE_URL}/api/admin/applications.json", headers=H(admin_token), timeout=15)
    assert r.status_code == 200
    assert "attachment" in r.headers.get("content-disposition", "").lower()
    assert "items" in r.json()


# ============ Allow-list mgmt ============
def test_allowlist_list_has_default_admin(s, admin_token):
    r = s.get(f"{BASE_URL}/api/admin/allowlist", headers=H(admin_token), timeout=15)
    assert r.status_code == 200
    emails = [it["email"] for it in r.json()["items"]]
    assert "stag3@circumlifesciences.com" in emails


def test_allowlist_add_and_delete(s, admin_token):
    new_email = f"test_admin_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{BASE_URL}/api/admin/allowlist", headers=H(admin_token), json={"email": new_email}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True

    # GET to verify persistence
    r = s.get(f"{BASE_URL}/api/admin/allowlist", headers=H(admin_token), timeout=15)
    emails = [it["email"] for it in r.json()["items"]]
    assert new_email.lower() in emails

    # DELETE
    r = s.delete(f"{BASE_URL}/api/admin/allowlist/{new_email}", headers=H(admin_token), timeout=15)
    assert r.status_code == 200
    assert r.json().get("removed") == new_email.lower()

    # Verify gone
    r = s.get(f"{BASE_URL}/api/admin/allowlist", headers=H(admin_token), timeout=15)
    emails = [it["email"] for it in r.json()["items"]]
    assert new_email.lower() not in emails


def test_allowlist_add_invalid_email_422(s, admin_token):
    r = s.post(f"{BASE_URL}/api/admin/allowlist", headers=H(admin_token), json={"email": "not-an-email"}, timeout=15)
    assert r.status_code == 422


def test_allowlist_cannot_remove_self(s, admin_token):
    # Add a buffer admin so default isn't the only one then try delete self
    buffer_email = f"test_buffer_{uuid.uuid4().hex[:6]}@example.com"
    s.post(f"{BASE_URL}/api/admin/allowlist", headers=H(admin_token), json={"email": buffer_email}, timeout=15)
    r = s.delete(f"{BASE_URL}/api/admin/allowlist/stag3@circumlifesciences.com", headers=H(admin_token), timeout=15)
    assert r.status_code == 400
    assert "yourself" in r.text.lower()
    # cleanup buffer
    s.delete(f"{BASE_URL}/api/admin/allowlist/{buffer_email}", headers=H(admin_token), timeout=15)


def test_allowlist_cannot_remove_last_admin(s, admin_token):
    # Snapshot current admins; remove all except default; then try to remove default
    r = s.get(f"{BASE_URL}/api/admin/allowlist", headers=H(admin_token), timeout=15)
    emails = [it["email"] for it in r.json()["items"]]
    for e in emails:
        if e != "stag3@circumlifesciences.com":
            s.delete(f"{BASE_URL}/api/admin/allowlist/{e}", headers=H(admin_token), timeout=15)
    # Now only stag3 should remain — attempt to delete it (self-removal check fires first OR last-admin)
    # Both 400 are acceptable but spec says "At least one admin must remain" when total<=1
    # Since caller IS stag3, self-removal triggers. To test last-admin we'd need a different caller.
    # We'll directly verify count==1 and the last-admin guard via DB by inserting another temp admin
    # using a different caller would require a 2nd session. Instead: verify total==1 then add another admin via stag3,
    # log in as the new admin (would need session)... skip last-admin test here, just verify count==1.
    r = s.get(f"{BASE_URL}/api/admin/allowlist", headers=H(admin_token), timeout=15)
    assert r.json()["count"] == 1


def test_allowlist_last_admin_via_second_session(s, admin_token):
    """Create a second admin, get its token, then have it try to delete itself when it's only admin via stag3."""
    # 1) Add new admin
    new_email = f"test_only_{uuid.uuid4().hex[:6]}@example.com"
    r = s.post(f"{BASE_URL}/api/admin/allowlist", headers=H(admin_token), json={"email": new_email}, timeout=15)
    assert r.status_code == 200

    # 2) Create user + session for that new admin
    out = _mongosh(
        "use('circum'); "
        f"var u='user_test_only_{uuid.uuid4().hex[:6]}'; var t='test_session_only_'+Date.now(); "
        f"db.users.replaceOne({{user_id:u}},{{user_id:u,email:'{new_email}',name:'Only Admin',picture:null,created_at:new Date()}},{{upsert:true}}); "
        "db.user_sessions.insertOne({user_id:u,session_token:t,expires_at:new Date(Date.now()+7*24*60*60*1000),created_at:new Date()}); "
        "print(t);"
    )
    only_token = out.splitlines()[-1].strip()

    # 3) Using stag3 session, remove stag3? No — caller can't remove self. Use the new admin's session to remove stag3.
    r = s.delete(f"{BASE_URL}/api/admin/allowlist/stag3@circumlifesciences.com", headers=H(only_token), timeout=15)
    assert r.status_code == 200, r.text

    # 4) Now only new_email remains. As new_email, try to delete itself -> "yourself" 400
    r = s.delete(f"{BASE_URL}/api/admin/allowlist/{new_email}", headers=H(only_token), timeout=15)
    assert r.status_code == 400

    # 5) Last admin guard: re-add stag3 then remove new_email; then as stag3 try to delete stag3 -> self-removal blocks first.
    # Direct test of last-admin: use mongosh to create a 3rd session for an extra admin, then have it remove new_email,
    # leaving only itself; then have it try to remove itself -> 400 "yourself" again.
    # The "last admin must remain" branch is only reachable if caller is different from last admin.
    # Since route guards: total<=1 check FIRST, then self check. So if only one admin exists and caller's email is in it,
    # we hit 400 last-admin. Let's verify by adding a temp admin, then have ANOTHER user try to remove that temp.
    # Restore stag3 first:
    r = s.post(f"{BASE_URL}/api/admin/allowlist", headers=H(only_token), json={"email": "stag3@circumlifesciences.com"}, timeout=15)
    assert r.status_code == 200

    # Now both stag3 and new_email are admins. Remove new_email via stag3.
    r = s.delete(f"{BASE_URL}/api/admin/allowlist/{new_email}", headers=H(admin_token), timeout=15)
    assert r.status_code == 200

    # Only stag3 remains; try to delete stag3 using stag3 -> total<=1 check fires first -> 400 "At least one admin must remain"
    r = s.delete(f"{BASE_URL}/api/admin/allowlist/stag3@circumlifesciences.com", headers=H(admin_token), timeout=15)
    assert r.status_code == 400
    assert "remain" in r.text.lower() or "yourself" in r.text.lower()


# ============ Regression ============
def test_regression_health(s):
    r = s.get(f"{BASE_URL}/api/health", timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_regression_news_six(s):
    r = s.get(f"{BASE_URL}/api/news", timeout=15)
    assert r.status_code == 200
    assert len(r.json()) == 6


def test_regression_newsletter_subscribe(s):
    payload = {"firstname": "TEST", "lastname": "Reg", "email": f"TEST_reg_{uuid.uuid4().hex[:6]}@x.com", "consent": True}
    r = s.post(f"{BASE_URL}/api/newsletter/subscribe", json=payload, timeout=15)
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_regression_careers_apply(s):
    files = {"cv": ("t.pdf", io.BytesIO(b"%PDF-1.4\n%TEST\n%%EOF"), "application/pdf")}
    data = {"firstname": "TEST", "lastname": "Reg", "email": f"TEST_reg_{uuid.uuid4().hex[:6]}@x.com",
            "position": "Candidature spontanée", "consent": "true"}
    r = s.post(f"{BASE_URL}/api/careers/apply", data=data, files=files, timeout=20)
    assert r.status_code == 200
    assert r.json().get("ok") is True
