"""
Augment every page-*.html with data-i18n / data-i18n-html attributes
by matching the visible French text to the FR dictionary in the
associated page-*.js bundle.

For each HTML element that:
  - has translatable text content
  - has NO data-i18n* attribute already
  - matches (normalized) one of the FR values for that page,
we add the appropriate data-i18n (or data-i18n-html) attribute.

Idempotent: re-running won't duplicate attributes.
"""
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString

FRONTEND = Path("/app/frontend")
I18N_DIR = FRONTEND / "js" / "i18n"

PAGE_MAP = {
    "index.html": "home",
    "apropos.html": "apropos",
    "fondateurs.html": "fondateurs",
    "design.html": "design",
    "fabrication.html": "fabrication",
    "clients.html": "clients",
    "news.html": "news",
    "newsletter.html": "newsletter",
    "carrieres.html": "carrieres",
    "contact.html": "contact",
}

# Classes whose elements we want to translate (text-only data-i18n)
TEXT_CLASSES = {
    "page-hero-eyebrow",
    "page-hero-subtitle",
    "section-label",
    "section-lead",
    "value-card-title",
    "value-card-text",
    "info-card-title",
    "info-card-text",
    "site-card-flag",
    "site-card-city",
    "site-card-country",
    "site-card-role",
    "feature-block-title",
    "feature-block-text",
    "kpi-bar-label",
    "kpi-bar-value",
    "newsletter-strip-title",
    "newsletter-strip-text",
    "cta-final-eyebrow",
    "cta-final-text",
    "highlight-quote",
    "pillar-title",
    "pillar-text",
    "pillar-list-item",
    "founder-name",
    "founder-role",
    "founder-bio",
    "footer-desc",
    "footer-col-title",
    "world-site-city",
    "world-site-role",
    "world-title",
    "world-text",
    "hero-eyebrow",
    "hero-subtitle",
    "mission-title",
    "mission-text",
    "figure-label",
    "process-step-title",
    "process-step-text",
}
# Classes that contain HTML (em / strong / br) -> use data-i18n-html
HTML_CLASSES = {
    "page-hero-title",
    "section-title",
    "cta-final-title",
    "page-hero-breadcrumb",
    "hero-title",
    "mission-title",
    "newsletter-strip-title",
    "cta-final-title",
    "prose-enhanced",
    "highlight-quote",
    "world-title",
}


def load_fr(page_id: str) -> dict[str, str]:
    if page_id == "common":
        path = I18N_DIR / "common.js"
    else:
        path = I18N_DIR / f"page-{page_id}.js"
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    m = re.search(r"=\s*(\{.*\})\s*;?\s*$", text, re.S)
    if not m:
        return {}
    return json.loads(m.group(1)).get("fr", {})


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()


def build_reverse(fr: dict[str, str]) -> dict[str, str]:
    """Map normalized FR value -> key."""
    rev: dict[str, str] = {}
    for k, v in fr.items():
        if not isinstance(v, str):
            continue
        nv = norm(v)
        if nv and nv not in rev:
            rev[nv] = k
    return rev


def el_text_for_match(el, html: bool) -> str:
    if html:
        # Use inner HTML, stripped
        return norm("".join(str(c) for c in el.children))
    return norm(el.get_text(" ", strip=True))


def has_i18n(el) -> bool:
    return any(a.startswith("data-i18n") for a in (el.attrs or {}))


def process_file(html_path: Path, page_id: str) -> int:
    fr_page = load_fr(page_id)
    fr_common = load_fr("common")

    rev_page = build_reverse(fr_page)
    rev_common = build_reverse(fr_common)

    html = html_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    added = 0

    # 1) Class-based candidates
    for el in soup.find_all(True):
        if has_i18n(el):
            continue
        classes = set(el.get("class") or [])
        is_html = bool(classes & HTML_CLASSES)
        is_text = bool(classes & TEXT_CLASSES) and not is_html
        if not (is_text or is_html):
            continue
        candidate = el_text_for_match(el, html=is_html)
        if not candidate:
            continue
        # Try page dict first (HTML-aware), then plain text
        key = None
        if is_html:
            key = rev_page.get(candidate) or rev_common.get(candidate)
            # Try also matching against text-only normalized
            if key is None:
                plain = norm(el.get_text(" ", strip=True))
                key = rev_page.get(plain) or rev_common.get(plain)
            if key is not None:
                el.attrs["data-i18n-html"] = key
                added += 1
        else:
            key = rev_page.get(candidate) or rev_common.get(candidate)
            if key is not None:
                el.attrs["data-i18n"] = key
                added += 1

    # 2) Bare <h3>, <h2>, <h1>, <p>, <span> inside prose-enhanced / others
    # Heuristic: any leaf element with text not yet tagged whose text exactly
    # matches a FR value
    for tag in ("h1", "h2", "h3", "h4", "p", "span", "div", "li", "small", "strong"):
        for el in soup.find_all(tag):
            if has_i18n(el):
                continue
            # Skip if any descendant has data-i18n already
            if el.find(lambda e: any(a.startswith("data-i18n") for a in (e.attrs or {}))):
                continue
            # Skip if has no direct text or has many child tags
            if not el.get_text(strip=True):
                continue
            plain = norm(el.get_text(" ", strip=True))
            inner_html = norm("".join(str(c) for c in el.children))
            # Prefer HTML key if inner HTML matches
            key = None
            if "<" in inner_html and inner_html != plain:
                key = rev_page.get(inner_html) or rev_common.get(inner_html)
                if key is not None:
                    el.attrs["data-i18n-html"] = key
                    added += 1
                    continue
            key = rev_page.get(plain) or rev_common.get(plain)
            if key is not None:
                # Choose attribute type
                if "<" in inner_html and inner_html != plain:
                    el.attrs["data-i18n-html"] = key
                else:
                    el.attrs["data-i18n"] = key
                added += 1

    # Write back
    out = str(soup)
    html_path.write_text(out, encoding="utf-8")
    return added


def main():
    for fname, page_id in PAGE_MAP.items():
        path = FRONTEND / fname
        if not path.exists():
            print(f"skip {fname}")
            continue
        added = process_file(path, page_id)
        print(f"{fname}: +{added} data-i18n attributes")


if __name__ == "__main__":
    main()
