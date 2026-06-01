"""
Second-pass: assign data-i18n-html to multi-child containers
(prose-enhanced, highlight-quote, etc.) by pairing them in document order
with the matching <page>.<class>.N keys in the page bundle.
"""
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup

FRONTEND = Path("/app/frontend")
I18N_DIR = FRONTEND / "js" / "i18n"

PAGES = {
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

# CSS class -> key prefix in the JSON
CONTAINER_MAP = {
    "prose-enhanced": "prose_enhanced",
    "highlight-quote": "highlight_quote",
    "page-hero-breadcrumb": "page_hero_breadcrumb",
    "page-hero-title": "page_hero_title",
    "page-hero-subtitle": "page_hero_subtitle",
    "page-hero-eyebrow": "page_hero_eyebrow",
    "cta-final-title": "cta_final_title",
    "newsletter-strip-title": "newsletter_strip_title",
}


def load_fr(page_id: str) -> dict[str, str]:
    path = I18N_DIR / f"page-{page_id}.js"
    if not path.exists():
        return {}
    txt = path.read_text(encoding="utf-8")
    m = re.search(r"=\s*(\{.*\})\s*;?\s*$", txt, re.S)
    return json.loads(m.group(1)).get("fr", {})


def key_index(k: str) -> int:
    m = re.search(r"\.(\d+)$", k)
    return int(m.group(1)) if m else 9999


def process(html_path: Path, page_id: str) -> int:
    fr = load_fr(page_id)
    html = html_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    added = 0

    for cls, prefix in CONTAINER_MAP.items():
        keys = sorted(
            (k for k in fr if k.startswith(f"{page_id}.{prefix}.")),
            key=key_index,
        )
        if not keys:
            continue
        # Find all elements with this class lacking data-i18n*
        elements = []
        for el in soup.find_all(class_=cls):
            if any(a.startswith("data-i18n") for a in (el.attrs or {})):
                # If already has data-i18n*, count it as consuming one key slot
                # so we don't reassign existing keys
                attr_keys = [v for a, v in el.attrs.items() if a.startswith("data-i18n")]
                # remove these from keys list
                for ak in attr_keys:
                    if isinstance(ak, str) and ak in keys:
                        keys.remove(ak)
                continue
            elements.append(el)

        for el, key in zip(elements, keys):
            el.attrs["data-i18n-html"] = key
            added += 1

    html_path.write_text(str(soup), encoding="utf-8")
    return added


def main():
    for fname, pid in PAGES.items():
        p = FRONTEND / fname
        if not p.exists():
            continue
        n = process(p, pid)
        print(f"{fname}: +{n} container i18n attributes")


if __name__ == "__main__":
    main()
