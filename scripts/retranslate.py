"""
Retranslate Circum Life Sciences site i18n bundles (FR -> EN/DE/IT)
using Claude Sonnet via the Emergent LLM key.

It rewrites every /app/frontend/js/i18n/page-*.js (and common.js if requested)
keeping the EXACT same key set under "fr" and producing high-quality
translations under "en", "de", "it".

HTML tags inside values are preserved verbatim.
"""
import asyncio
import json
import os
import re
import sys
import uuid
from pathlib import Path

from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = "sk-emergent-8F4646dFeDfB869DdE"
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-6"

I18N_DIR = Path("/app/frontend/js/i18n")
BATCH = 25  # strings per LLM call


def load_bundle(path: Path) -> dict:
    """Parse window.CIRCUM_I18N_X = {...}; file -> python dict."""
    text = path.read_text(encoding="utf-8")
    m = re.search(r"=\s*(\{.*\})\s*;?\s*$", text, re.S)
    if not m:
        raise ValueError(f"Cannot parse {path}")
    return json.loads(m.group(1))


def save_bundle(path: Path, var_name: str, data: dict) -> None:
    js = f"window.{var_name}=" + json.dumps(data, ensure_ascii=False) + ";\n"
    path.write_text(js, encoding="utf-8")


SYSTEM_MSG = (
    "You are a professional translator for a Swiss medical-device CDMO company "
    "(Circum Life Sciences). You translate from FRENCH to {target_lang_name}. "
    "Strict rules:\n"
    "1. Preserve every HTML tag and attribute EXACTLY (<strong>, <em>, <br>, <a href=...>, etc.).\n"
    "2. Preserve every placeholder (e.g. {{value}}, %s) and special chars (· →).\n"
    "3. Keep brand names verbatim: 'Circum', 'Circum Life Sciences', 'Force One', 'CDMO', 'ISO 13485', 'MDR', 'FDA'.\n"
    "4. Use professional, polished, industry-appropriate medical/regulatory vocabulary.\n"
    "5. NEVER add commentary. Return ONLY the requested JSON object with translations.\n"
    "6. Keep the same punctuation style (e.g. middle dot · instead of bullets).\n"
    "7. Do not translate email addresses unless an obvious local variant is given (e.g. 'votre@email.com' -> 'your@email.com')."
)

LANG_NAMES = {
    "en": "ENGLISH (UK/international, formal business tone)",
    "de": "GERMAN (Sie-form, formal business tone)",
    "it": "ITALIAN (formal Lei/voi business tone)",
}


async def translate_batch(fr_pairs: list[tuple[str, str]], target_lang: str) -> dict[str, str]:
    """fr_pairs = list of (key, fr_value). Returns {key: translated}."""
    payload = {k: v for k, v in fr_pairs}
    user_text = (
        "Translate every VALUE in the JSON below from French to "
        f"{LANG_NAMES[target_lang]}. Return STRICTLY a JSON object with the same keys "
        "and translated values. No prose, no markdown fences.\n\n"
        f"INPUT:\n{json.dumps(payload, ensure_ascii=False)}"
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=SYSTEM_MSG.format(target_lang_name=LANG_NAMES[target_lang]),
    ).with_model(MODEL_PROVIDER, MODEL_NAME)
    resp = await chat.send_message(UserMessage(text=user_text))

    # Extract JSON
    text = resp.strip()
    # Strip fences if any
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        out = json.loads(text)
    except json.JSONDecodeError:
        # Find first { ... last }
        s = text.find("{")
        e = text.rfind("}")
        out = json.loads(text[s : e + 1])

    return {k: out.get(k, fr_pairs[i][1]) for i, (k, _) in enumerate(fr_pairs)}


async def translate_dict(fr: dict, target_lang: str) -> dict:
    keys = list(fr.keys())
    result: dict[str, str] = {}
    # Build batches
    batches: list[list[tuple[str, str]]] = []
    cur: list[tuple[str, str]] = []
    cur_chars = 0
    for k in keys:
        v = fr[k]
        if not isinstance(v, str):
            result[k] = v
            continue
        if len(cur) >= BATCH or (cur_chars + len(v)) > 6000:
            batches.append(cur)
            cur = []
            cur_chars = 0
        cur.append((k, v))
        cur_chars += len(v)
    if cur:
        batches.append(cur)

    print(f"  -> {target_lang.upper()}: {len(keys)} strings in {len(batches)} batches")
    for i, b in enumerate(batches, 1):
        for attempt in range(3):
            try:
                part = await translate_batch(b, target_lang)
                result.update(part)
                print(f"     batch {i}/{len(batches)} done ({len(b)} keys)")
                break
            except Exception as e:
                print(f"     batch {i} attempt {attempt + 1} failed: {e}")
                await asyncio.sleep(2 * (attempt + 1))
        else:
            # All retries failed – fall back to FR text
            for k, v in b:
                result.setdefault(k, v)
    return result


PAGE_FILES = [
    ("common.js", "CIRCUM_I18N_COMMON"),
    ("page-home.js", "CIRCUM_I18N_PAGE"),
    ("page-apropos.js", "CIRCUM_I18N_PAGE"),
    ("page-fondateurs.js", "CIRCUM_I18N_PAGE"),
    ("page-design.js", "CIRCUM_I18N_PAGE"),
    ("page-fabrication.js", "CIRCUM_I18N_PAGE"),
    ("page-clients.js", "CIRCUM_I18N_PAGE"),
    ("page-news.js", "CIRCUM_I18N_PAGE"),
    ("page-newsletter.js", "CIRCUM_I18N_PAGE"),
    ("page-carrieres.js", "CIRCUM_I18N_PAGE"),
    ("page-contact.js", "CIRCUM_I18N_PAGE"),
]


async def process_file(filename: str, var_name: str) -> None:
    path = I18N_DIR / filename
    if not path.exists():
        print(f"  ! missing {path}")
        return
    print(f"\n== {filename} ==")
    bundle = load_bundle(path)
    fr = bundle.get("fr", {})
    if not fr:
        print("  (no FR keys, skip)")
        return
    new_bundle: dict = {"fr": fr}
    for lang in ("en", "de", "it"):
        new_bundle[lang] = await translate_dict(fr, lang)
    save_bundle(path, var_name, new_bundle)
    print(f"  saved {path}")


async def main() -> None:
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for filename, var in PAGE_FILES:
        if only and only not in filename:
            continue
        await process_file(filename, var)


if __name__ == "__main__":
    asyncio.run(main())
