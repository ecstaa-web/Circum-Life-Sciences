#!/usr/bin/env python3
"""
Serve the Circum static site + proxy /api to FastAPI — no Node.js required.

Usage:
  python scripts/serve_frontend.py

Environment:
  PORT=3000
  BACKEND_URL=http://127.0.0.1:8000
"""
from __future__ import annotations

import os
import sys
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
BACKEND = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")
PORT = int(os.environ.get("PORT", "3000"))
HOST = os.environ.get("HOST", "127.0.0.1")
IS_PROD = os.environ.get("ENVIRONMENT", "").lower() == "production"

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-XSS-Protection": "0",
    "Content-Security-Policy": os.environ.get(
        "CONTENT_SECURITY_POLICY",
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; "
        "media-src 'self'; font-src 'self' data:; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000; "
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    ),
}
if IS_PROD:
    SECURITY_HEADERS["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"


class CircumHandler(SimpleHTTPRequestHandler):
    """Static files from frontend/ + reverse proxy for /api."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), fmt % args))

    def _send_security_headers(self) -> None:
        path = self.path.split("?", 1)[0].rstrip("/")
        is_admin = path in ("/admin", "/admin.html")
        for key, value in SECURITY_HEADERS.items():
            if key == "X-Frame-Options":
                self.send_header(key, "DENY" if is_admin else "SAMEORIGIN")
                continue
            if key == "Content-Security-Policy" and not is_admin:
                value = value.replace("frame-ancestors 'none'", "frame-ancestors 'self'")
            self.send_header(key, value)
        if not IS_PROD:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")

    def _is_api(self) -> bool:
        return self.path == "/api" or self.path.startswith("/api/")

    def _proxy_api(self) -> None:
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        target = BACKEND + self.path

        headers = {}
        for key, value in self.headers.items():
            lk = key.lower()
            if lk in ("host", "connection", "keep-alive", "proxy-connection", "te", "trailers", "upgrade"):
                continue
            headers[key] = value

        req = Request(target, data=body, headers=headers, method=self.command)
        try:
            with urlopen(req, timeout=120) as resp:
                self.send_response(resp.status)
                skip = {"transfer-encoding", "connection", "server"}
                for key, value in resp.headers.items():
                    if key.lower() not in skip:
                        self.send_header(key, value)
                self._send_security_headers()
                self.end_headers()
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
        except HTTPError as err:
            self.send_response(err.code)
            for key, value in err.headers.items():
                if key.lower() not in ("transfer-encoding", "connection", "server"):
                    self.send_header(key, value)
            self._send_security_headers()
            self.end_headers()
            self.wfile.write(err.read())
        except URLError:
            payload = b'{"detail":"Backend unavailable"}'
            self.send_response(HTTPStatus.BAD_GATEWAY)
            self.send_header("Content-Type", "application/json")
            self._send_security_headers()
            self.end_headers()
            self.wfile.write(payload)

    def _resolve_static(self) -> Path | None:
        raw = self.path.split("?", 1)[0]
        if raw in ("", "/"):
            candidate = FRONTEND / "index.html"
            return candidate if candidate.is_file() else None

        # Route courte /admin → frontend/admin.html
        if raw.rstrip("/") == "/admin":
            admin = FRONTEND / "admin.html"
            return admin if admin.is_file() else None

        rel = raw.lstrip("/")
        direct = FRONTEND / rel
        if direct.is_file():
            return direct
        if direct.is_dir() and (direct / "index.html").is_file():
            return direct / "index.html"

        html_candidate = FRONTEND / f"{rel}.html" if not rel.endswith(".html") else direct
        if html_candidate.is_file():
            return html_candidate
        return None

    def _serve_static(self) -> None:
        target = self._resolve_static()
        if not target:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return

        rel = target.relative_to(FRONTEND).as_posix()
        old_path = self.path
        self.path = "/" + rel
        try:
            super().do_GET()
        finally:
            self.path = old_path

    def do_GET(self) -> None:
        if self._is_api():
            self._proxy_api()
        else:
            self._serve_static()

    def do_HEAD(self) -> None:
        if self._is_api():
            self._proxy_api()
        else:
            self._serve_static()

    def do_POST(self) -> None:
        if self._is_api():
            self._proxy_api()
        else:
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def do_PUT(self) -> None:
        if self._is_api():
            self._proxy_api()
        else:
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def do_DELETE(self) -> None:
        if self._is_api():
            self._proxy_api()
        else:
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def do_OPTIONS(self) -> None:
        if self._is_api():
            self._proxy_api()
        else:
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def end_headers(self) -> None:
        if not self._is_api():
            self._send_security_headers()
        super().end_headers()


def main() -> None:
    if not FRONTEND.is_dir():
        print(f"Frontend directory not found: {FRONTEND}", file=sys.stderr)
        sys.exit(1)

    server = ThreadingHTTPServer((HOST, PORT), CircumHandler)
    print(f"Circum site (Python) -> http://{HOST}:{PORT}")
    print(f"API proxy -> {BACKEND}/api")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
