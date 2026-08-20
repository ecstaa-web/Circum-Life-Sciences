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
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}


def fetch_vinted(query: str, console: str, brand: str, limit: int = 15) -> list[RawListing]:
    url = f"https://www.vinted.fr/catalog?search_text={quote(query)}"
    try:
        with httpx.Client(timeout=25, follow_redirects=True) as client:
            resp = client.get(url, headers=HEADERS)
            if resp.status_code != 200:
                return []
    except httpx.HTTPError:
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    containers = soup.select('[class*="new-item-box__container"]')
    results: list[RawListing] = []
    seen: set[str] = set()

    for container in containers:
        if len(results) >= limit:
            break

        link = container.select_one('a[href*="/items/"]')
        if not link:
            continue

        href = link.get("href", "")
        match = re.search(r"/items/(\d+)-(.+?)(?:\?|$)", href)
        if not match:
            continue

        item_id, slug = match.group(1), match.group(2)
        if item_id in seen:
            continue
        seen.add(item_id)

        title = slug.replace("-", " ").strip().title()
        texts = [t.get_text(strip=True) for t in container.select('[class*="web_ui__Text"]')]
        price_text = next((t for t in texts if "€" in t and "incl" not in t.lower()), "")
        price = parse_price(price_text)
        if price is None:
            continue

        condition = next(
            (t for t in texts if t.lower() in ("neuf", "très bon état", "bon état", "satisfaisant")),
            "Bon",
        )

        img = container.select_one("img")
        image_url = (img.get("src") or img.get("data-src") or "") if img else ""
        if image_url.startswith("//"):
            image_url = "https:" + image_url

        source_url = "https://www.vinted.fr" + href.split("?")[0]
        description = f"Annonce Vinted — {title}. État: {condition}."

        results.append(
            RawListing(
                external_id=item_id,
                source="Vinted",
                source_url=source_url,
                title=title,
                description=description,
                console=console,
                brand=brand,
                price=price,
                currency="EUR",
                location="France",
                image_url=image_url or "https://picsum.photos/seed/vinted/800/600",
                condition=condition,
                is_collectible=detect_collectible(title, description),
            )
        )

    return results
