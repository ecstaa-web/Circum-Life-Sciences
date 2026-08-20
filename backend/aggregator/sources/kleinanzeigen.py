import json
import re
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup

from aggregator.base import RawListing
from aggregator.queries import detect_collectible, parse_price

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
}


def fetch_kleinanzeigen(query: str, console: str, brand: str, limit: int = 15) -> list[RawListing]:
    slug = quote(query.replace(" ", "-").lower())
    url = f"https://www.kleinanzeigen.de/s-{slug}/k0"

    try:
        with httpx.Client(timeout=25, follow_redirects=True) as client:
            resp = client.get(url, headers=HEADERS)
            if resp.status_code != 200:
                return []
    except httpx.HTTPError:
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    articles = soup.select("article.aditem")
    results: list[RawListing] = []

    for article in articles[:limit]:
        ad_id = article.get("data-adid")
        href = article.get("data-href", "")
        if not ad_id:
            continue

        title_el = article.select_one("h2 a, .ellipsis")
        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            continue

        desc_el = article.select_one(".aditem-main--middle--description")
        description = desc_el.get_text(strip=True) if desc_el else title

        price_el = article.select_one(".aditem-main--middle--price-shipping--price")
        price = parse_price(price_el.get_text(strip=True) if price_el else "")
        if price is None:
            continue

        loc_el = article.select_one(".aditem-main--top--left")
        location = loc_el.get_text(strip=True) if loc_el else "Deutschland"
        location = re.sub(r"^\s*\S+\s+", "", location).strip() or "Deutschland"

        img = article.select_one("img")
        image_url = img.get("src", "") if img else ""
        if image_url.startswith("//"):
            image_url = "https:" + image_url

        ld_script = article.select_one('script[type="application/ld+json"]')
        if ld_script and not image_url:
            try:
                ld = json.loads(ld_script.string or "{}")
                image_url = ld.get("contentUrl", "")
            except json.JSONDecodeError:
                pass

        source_url = f"https://www.kleinanzeigen.de{href}"

        results.append(
            RawListing(
                external_id=ad_id,
                source="Kleinanzeigen",
                source_url=source_url,
                title=title,
                description=description[:500],
                console=console,
                brand=brand,
                price=price,
                currency="EUR",
                location=f"{location}, Allemagne",
                image_url=image_url or "https://picsum.photos/seed/ka/800/600",
                condition="Gebraucht",
                is_collectible=detect_collectible(title, description),
            )
        )

    return results
