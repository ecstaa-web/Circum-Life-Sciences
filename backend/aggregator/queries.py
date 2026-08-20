"""Console search queries used across all marketplace sources."""

CONSOLE_QUERIES = [
    {"query": "nintendo 64 console", "console": "Nintendo 64", "brand": "Nintendo"},
    {"query": "super nintendo snes console", "console": "Super Nintendo", "brand": "Nintendo"},
    {"query": "gamecube console", "console": "GameCube", "brand": "Nintendo"},
    {"query": "nintendo switch oled", "console": "Nintendo Switch", "brand": "Nintendo"},
    {"query": "game boy color", "console": "Game Boy Color", "brand": "Nintendo"},
    {"query": "playstation 5 console", "console": "PlayStation 5", "brand": "Sony"},
    {"query": "playstation 4 console", "console": "PlayStation 4", "brand": "Sony"},
    {"query": "playstation 2 console", "console": "PlayStation 2", "brand": "Sony"},
    {"query": "playstation 1 ps1", "console": "PlayStation 1", "brand": "Sony"},
    {"query": "xbox series x console", "console": "Xbox Series X", "brand": "Microsoft"},
    {"query": "xbox 360 console", "console": "Xbox 360", "brand": "Microsoft"},
    {"query": "sega dreamcast console", "console": "Dreamcast", "brand": "Sega"},
    {"query": "mega drive genesis", "console": "Mega Drive", "brand": "Sega"},
    {"query": "neo geo aes", "console": "Neo Geo AES", "brand": "SNK"},
    {"query": "atari 2600", "console": "Atari 2600", "brand": "Atari"},
    {"query": "nintendo wii console", "console": "Nintendo Wii", "brand": "Nintendo"},
]

COLLECTOR_KEYWORDS = {
    "cib", "complete", "complet", "boîte", "boite", "ovp", "boxed", "sealed", "scellé",
    "scelle", "limited", "limitée", "edition", "édition", "funtastic", "net yaroze",
    "dev kit", "collector", "rare", "grail", "atomic purple", "crystal",
}

BRAND_FROM_CONSOLE = {q["console"]: q["brand"] for q in CONSOLE_QUERIES}


def detect_collectible(title: str, description: str) -> bool:
    text = f"{title} {description}".lower()
    return any(kw in text for kw in COLLECTOR_KEYWORDS)


def parse_price(text: str) -> float | None:
    import re

    if not text:
        return None
    cleaned = text.replace("\xa0", " ").replace(",", ".")
    match = re.search(r"(\d+(?:\.\d+)?)", cleaned)
    return float(match.group(1)) if match else None
