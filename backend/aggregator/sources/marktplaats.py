import httpx

from aggregator.base import RawListing
from aggregator.queries import detect_collectible

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}

SOURCES = {
    "Marktplaats": {
        "api": "https://www.marktplaats.nl/lrp/api/search",
        "site": "https://www.marktplaats.nl",
        "location": "Pays-Bas",
        "currency": "EUR",
    },
    "2dehands": {
        "api": "https://www.2dehands.be/lrp/api/search",
        "site": "https://www.2dehands.be",
        "location": "Belgique",
        "currency": "EUR",
    },
    "2ememain": {
        "api": "https://www.2ememain.be/lrp/api/search",
        "site": "https://www.2ememain.be",
        "location": "Belgique",
        "currency": "EUR",
    },
}


def _condition_from_attrs(attrs: list) -> str:
    for attr in attrs or []:
        if attr.get("key") == "condition":
            val = attr.get("value", "")
            mapping = {
                "Gebruikt": "Bon",
                "Used": "Bon",
                "Nieuw": "Neuf",
                "New": "Neuf",
                "Utilisé": "Bon",
                "Neuf": "Neuf",
            }
            return mapping.get(val, val or "Bon")
    return "Bon"


def fetch_marktplaats_family(
    source_name: str, query: str, console: str, brand: str, limit: int = 15
) -> list[RawListing]:
    cfg = SOURCES[source_name]
    params = {
        "query": query,
        "limit": limit,
        "offset": 0,
        "searchInTitleAndDescription": "true",
    }

    try:
        with httpx.Client(timeout=20) as client:
            resp = client.get(cfg["api"], params=params, headers=HEADERS)
            if resp.status_code != 200:
                return []
            data = resp.json()
    except httpx.HTTPError:
        return []

    results: list[RawListing] = []
    for item in data.get("listings", [])[:limit]:
        item_id = item.get("itemId", "")
        if not item_id:
            continue

        price_cents = item.get("priceInfo", {}).get("priceCents", 0)
        price = price_cents / 100 if price_cents else 0
        if price <= 0:
            continue

        title = item.get("title", "")
        description = item.get("description") or item.get("categorySpecificDescription") or title
        location_data = item.get("location", {})
        city = location_data.get("cityName", cfg["location"])
        country = location_data.get("countryName", "")

        images = item.get("imageUrls") or []
        image_url = images[0] if images else ""
        if image_url.startswith("//"):
            image_url = "https:" + image_url

        source_url = f"{cfg['site']}/a/{item_id}"
        condition = _condition_from_attrs(item.get("attributes", []))

        results.append(
            RawListing(
                external_id=item_id,
                source=source_name,
                source_url=source_url,
                title=title,
                description=description[:500],
                console=console,
                brand=brand,
                price=price,
                currency=cfg["currency"],
                location=f"{city}, {country}".strip(", "),
                image_url=image_url or "https://picsum.photos/seed/mp/800/600",
                condition=condition,
                is_collectible=detect_collectible(title, description),
            )
        )

    return results
