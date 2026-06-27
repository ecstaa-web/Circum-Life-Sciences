"""
Stockage JSON local pour le dev sans droits admin (pas de MongoDB à installer).

Activé quand MONGO_URL=json://./data/local_db dans backend/.env
Chaque collection = un fichier JSON dans backend/data/local_db/<collection>.json
"""
from __future__ import annotations

import asyncio
import json
import re
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


def _json_default(obj: Any) -> Any:
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Not JSON serializable: {type(obj)}")


def _matches(doc: dict, query: dict) -> bool:
    for key, expected in query.items():
        if isinstance(expected, dict):
            if "$regex" in expected:
                value = str(doc.get(key, "") or "")
                flags = re.I if expected.get("$options", "").find("i") >= 0 else 0
                if not re.search(expected["$regex"], value, flags):
                    return False
                continue
            return False
        if doc.get(key) != expected:
            return False
    return True


def _apply_projection(doc: dict, projection: Optional[dict]) -> dict:
    if not projection:
        return deepcopy(doc)
    out = deepcopy(doc)
    if any(v == 1 for k, v in projection.items() if k != "_id"):
        allowed = {k for k, v in projection.items() if v == 1}
        if projection.get("_id") == 0:
            allowed.discard("_id")
        out = {k: v for k, v in out.items() if k in allowed}
    else:
        for key, val in projection.items():
            if val == 0 and key in out:
                del out[key]
    return out


def _apply_update(doc: dict, update: dict) -> dict:
    doc = deepcopy(doc)
    if "$set" in update:
        for key, value in update["$set"].items():
            if "." in key:
                parts = key.split(".")
                cur = doc
                for part in parts[:-1]:
                    nxt = cur.get(part)
                    if not isinstance(nxt, dict):
                        nxt = {}
                        cur[part] = nxt
                    cur = nxt
                cur[parts[-1]] = value
            else:
                doc[key] = value
    if "$unset" in update:
        for key in update["$unset"]:
            if "." in key:
                parts = key.split(".")
                cur = doc
                for part in parts[:-1]:
                    if not isinstance(cur.get(part), dict):
                        cur = None
                        break
                    cur = cur[part]
                if isinstance(cur, dict):
                    cur.pop(parts[-1], None)
            else:
                doc.pop(key, None)
    if "$inc" in update:
        for key, delta in update["$inc"].items():
            doc[key] = int(doc.get(key, 0)) + int(delta)
    return doc


class _OpResult:
    def __init__(self, matched: int = 0, modified: int = 0, deleted: int = 0):
        self.matched_count = matched
        self.modified_count = modified
        self.deleted_count = deleted


class JsonCursor:
    def __init__(self, docs: list[dict], projection: Optional[dict] = None):
        self._docs = docs
        self._projection = projection
        self._sort_field: Optional[str] = None
        self._sort_dir = -1
        self._index = 0
        self._prepared: Optional[list[dict]] = None

    def sort(self, field: str, direction: int = -1) -> "JsonCursor":
        self._sort_field = field
        self._sort_dir = direction
        self._prepared = None
        return self

    def _materialize(self) -> list[dict]:
        if self._prepared is not None:
            return self._prepared
        docs = list(self._docs)
        if self._sort_field:
            docs.sort(key=lambda d: d.get(self._sort_field) or "", reverse=self._sort_dir < 0)
        self._prepared = [_apply_projection(d, self._projection) for d in docs]
        return self._prepared

    def __aiter__(self) -> "JsonCursor":
        self._index = 0
        return self

    async def __anext__(self) -> dict:
        items = self._materialize()
        if self._index >= len(items):
            raise StopAsyncIteration
        item = items[self._index]
        self._index += 1
        return item


class JsonCollection:
    def __init__(self, path: Path, lock: asyncio.Lock) -> None:
        self._path = path
        self._lock = lock

    async def _read(self) -> list[dict]:
        if not self._path.is_file():
            return []
        text = await asyncio.to_thread(self._path.read_text, encoding="utf-8")
        data = json.loads(text or "[]")
        return data if isinstance(data, list) else []

    async def _write(self, docs: list[dict]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(docs, ensure_ascii=False, indent=2, default=_json_default)
        await asyncio.to_thread(self._path.write_text, payload, encoding="utf-8")

    async def create_index(self, *_args, **_kwargs) -> None:
        return None

    async def count_documents(self, query: dict | None = None) -> int:
        query = query or {}
        async with self._lock:
            docs = await self._read()
        return sum(1 for d in docs if _matches(d, query))

    async def find_one(self, query: dict, projection: Optional[dict] = None) -> Optional[dict]:
        async with self._lock:
            docs = await self._read()
        for doc in docs:
            if _matches(doc, query):
                return _apply_projection(doc, projection)
        return None

    def find(self, query: dict | None = None, projection: Optional[dict] = None) -> JsonCursor:
        query = query or {}
        # Lecture synchrone différée via cursor — ok pour dev local mono-process
        docs = []
        if self._path.is_file():
            try:
                raw = json.loads(self._path.read_text(encoding="utf-8") or "[]")
                docs = [d for d in raw if isinstance(d, dict) and _matches(d, query)]
            except Exception:
                docs = []
        return JsonCursor(docs, projection)

    async def insert_one(self, doc: dict) -> _OpResult:
        async with self._lock:
            docs = await self._read()
            docs.append(deepcopy(doc))
            await self._write(docs)
        return _OpResult(matched=1, modified=1)

    async def insert_many(self, docs_in: list[dict]) -> _OpResult:
        async with self._lock:
            docs = await self._read()
            docs.extend(deepcopy(d) for d in docs_in)
            await self._write(docs)
        return _OpResult(matched=len(docs_in), modified=len(docs_in))

    async def update_one(self, query: dict, update: dict, upsert: bool = False) -> _OpResult:
        async with self._lock:
            docs = await self._read()
            for i, doc in enumerate(docs):
                if _matches(doc, query):
                    docs[i] = _apply_update(doc, update)
                    await self._write(docs)
                    return _OpResult(matched=1, modified=1)
            if upsert:
                new_doc = deepcopy(query)
                new_doc = _apply_update(new_doc, update)
                docs.append(new_doc)
                await self._write(docs)
                return _OpResult(matched=0, modified=1)
        return _OpResult(matched=0, modified=0)

    async def delete_one(self, query: dict) -> _OpResult:
        async with self._lock:
            docs = await self._read()
            for i, doc in enumerate(docs):
                if _matches(doc, query):
                    del docs[i]
                    await self._write(docs)
                    return _OpResult(matched=1, deleted=1)
        return _OpResult(matched=0, deleted=0)

    async def delete_many(self, query: dict) -> _OpResult:
        async with self._lock:
            docs = await self._read()
            kept = [d for d in docs if not _matches(d, query)]
            deleted = len(docs) - len(kept)
            if deleted:
                await self._write(kept)
            return _OpResult(matched=deleted, deleted=deleted)


class JsonDatabase:
    """Remplace client[DB_NAME] pour le mode dev local."""

    def __init__(self, root: Path) -> None:
        self._root = root
        self._root.mkdir(parents=True, exist_ok=True)
        self._lock = asyncio.Lock()
        self._collections: dict[str, JsonCollection] = {}

    def __getitem__(self, name: str) -> JsonCollection:
        if name not in self._collections:
            self._collections[name] = JsonCollection(self._root / f"{name}.json", self._lock)
        return self._collections[name]
