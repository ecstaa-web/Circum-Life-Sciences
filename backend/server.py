import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

YACHTS_PATH = Path(__file__).resolve().parent.parent / "frontend" / "data" / "yachts.json"
YACHTS = json.loads(YACHTS_PATH.read_text(encoding="utf-8"))
INQUIRIES: List[dict] = []

app = FastAPI(title="Nereïs Yachts", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Inquiry(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    yacht_id: str = Field(default="", max_length=80)
    message: str = Field(min_length=8, max_length=4000)
    interest: str = Field(default="acquisition", max_length=40)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "nereis", "yachts": len(YACHTS)}


@app.get("/api/yachts")
async def list_yachts(category: Optional[str] = None):
    items = YACHTS
    if category and category != "all":
        items = [y for y in YACHTS if y.get("category") == category]
    return {"yachts": items, "count": len(items)}


@app.get("/api/yachts/{yacht_id}")
async def get_yacht(yacht_id: str):
    for yacht in YACHTS:
        if yacht["id"] == yacht_id:
            return yacht
    raise HTTPException(status_code=404, detail="Yacht introuvable")


@app.post("/api/inquiries")
async def create_inquiry(inquiry: Inquiry):
    record = inquiry.model_dump()
    record["received_at"] = datetime.utcnow().isoformat() + "Z"
    INQUIRIES.append(record)
    return {
        "ok": True,
        "message": "Votre demande a été transmise à la Maison. Un conseiller Nereïs vous répondra sous 24 heures.",
        "reference": f"NR-{len(INQUIRIES):04d}",
    }
