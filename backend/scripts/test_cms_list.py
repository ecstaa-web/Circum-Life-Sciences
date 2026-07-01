"""Quick smoke test for CMS pages list (JSON store)."""
import asyncio
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from json_store import JsonDatabase  # noqa: E402
from cms_store import seed_cms_pages, list_pages  # noqa: E402


async def main() -> None:
    db = JsonDatabase(BACKEND / "data" / "local_db")
    await seed_cms_pages(db)
    items = await list_pages(db)
    print("pages:", len(items))
    for p in items:
        print("-", p.get("title"), p.get("page_id"), p.get("page_type"))


if __name__ == "__main__":
    asyncio.run(main())
