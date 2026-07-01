"""Unit tests for CMS store (sanitization, validation)."""
import pytest
from fastapi import HTTPException

from cms_store import (
    sanitize_blocks,
    validate_slug,
    default_block,
    sanitize_seo,
)


def test_validate_slug_ok():
    assert validate_slug("ma-page-test") == "ma-page-test"


def test_validate_slug_invalid():
    with pytest.raises(HTTPException):
        validate_slug("Bad Slug!")


def test_default_block_has_id():
    block = default_block("hero")
    assert block["type"] == "hero"
    assert block.get("id")


def test_sanitize_blocks_strips_unknown():
    blocks = sanitize_blocks([
        {"type": "hero", "id": "abc", "title": "Hello", "subtitle": "<script>x</script>"},
        {"type": "unknown", "id": "x"},
    ])
    assert len(blocks) == 1
    assert blocks[0]["type"] == "hero"
    assert "<script>" not in blocks[0].get("subtitle", "")


def test_sanitize_seo():
    seo = sanitize_seo({"meta_title": "T", "meta_description": "D"}, "Fallback")
    assert seo["meta_title"] == "T"
    assert seo["meta_description"] == "D"
