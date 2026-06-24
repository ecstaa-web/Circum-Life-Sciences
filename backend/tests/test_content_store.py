"""Unit tests for site content storage and HTML sanitization."""
import pytest
from fastapi import HTTPException

from content_store import (
    load_base_content,
    list_pages,
    sanitize_html,
    validate_content_key,
    validate_lang,
)


class TestSanitizeHtml:
    def test_plain_text_unchanged(self):
        assert sanitize_html("Bonjour Circum") == "Bonjour Circum"

    def test_allowed_tags_preserved(self):
        raw = 'Titre <strong>gras</strong> et <em>italique</em><br>suite'
        out = sanitize_html(raw)
        assert "<strong>gras</strong>" in out
        assert "<em>italique</em>" in out
        assert "<br>" in out

    def test_script_stripped(self):
        raw = 'Hello<script>alert("xss")</script> world'
        out = sanitize_html(raw)
        assert "script" not in out.lower()
        assert "Hello" in out
        assert "world" in out

    def test_onclick_stripped(self):
        raw = '<span onclick="alert(1)">Click</span>'
        out = sanitize_html(raw)
        assert "onclick" not in out
        assert "Click" in out

    def test_javascript_href_stripped(self):
        raw = '<a href="javascript:alert(1)">bad</a>'
        out = sanitize_html(raw)
        assert "javascript:" not in out
        assert "bad" in out

    def test_safe_link_preserved(self):
        raw = '<a href="https://circumlifesciences.com">Site</a>'
        out = sanitize_html(raw)
        assert 'href="https://circumlifesciences.com"' in out

    def test_styled_span_preserved(self):
        raw = '<span style="color:#205a99;font-size:24px;font-family:Georgia,serif">Titre</span>'
        out = sanitize_html(raw)
        assert "color:#205a99" in out.replace(" ", "")
        assert "font-size:24px" in out.replace(" ", "")
        assert "Titre" in out

    def test_style_xss_stripped(self):
        raw = '<span style="background:url(javascript:alert(1))">x</span>'
        out = sanitize_html(raw)
        assert "javascript" not in out.lower()
        assert "x" in out


class TestValidators:
    def test_valid_key(self):
        assert validate_content_key("home.hero_title.2") == "home.hero_title.2"

    def test_invalid_key_rejected(self):
        with pytest.raises(HTTPException):
            validate_content_key("../etc/passwd")

    def test_lang(self):
        assert validate_lang("FR") == "fr"

    def test_invalid_lang(self):
        with pytest.raises(HTTPException):
            validate_lang("xx")


class TestLocaleFiles:
    def test_base_content_not_empty(self):
        base = load_base_content()
        assert len(base) > 50
        assert "nav.about" in base

    def test_pages_list(self):
        pages = list_pages()
        ids = [p["id"] for p in pages]
        assert "home" in ids
        assert "common" in ids
