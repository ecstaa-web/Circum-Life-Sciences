#!/usr/bin/env python3
"""Build upload-ready WordPress theme from static HTML."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT
THEME = ROOT / "wordpress-theme" / "circum"

PAGES = {
    "index.html": ("front-page.php", "home"),
    "apropos.html": ("page-apropos.php", "apropos"),
    "design.html": ("page-design.php", "design"),
    "fabrication.html": ("page-fabrication.php", "fabrication"),
    "clients.html": ("page-clients.php", "clients"),
    "news.html": ("page-news.php", "news"),
    "news-article.html": ("page-news-article.php", "news-article"),
    "newsletter.html": ("page-newsletter.php", "newsletter"),
    "carrieres.html": ("page-carrieres.php", "carrieres"),
    "contact.html": ("page-contact.php", "contact"),
    "privacy-policy.html": ("page-privacy-policy.php", "privacy-policy"),
    "legal-notice.html": ("page-legal-notice.php", "legal-notice"),
    "cookies.html": ("page-cookies.php", "cookies"),
}

PAGE_SLUGS = {v[1] for v in PAGES.values()}


def sync_assets() -> None:
    for folder in ("css", "js", "assets"):
        src, dst = SRC / folder, THEME / folder
        if src.exists():
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
    if (SRC / "sw.js").exists():
        shutil.copy2(SRC / "sw.js", THEME / "sw.js")


def wp_url(page: str, hash_part: str = "") -> str:
    if hash_part:
        return f"<?php echo esc_url( circum_url('{page}', '{hash_part}') ); ?>"
    return f"<?php echo esc_url( circum_url('{page}') ); ?>"


def wp_asset(path: str) -> str:
    return f"<?php echo esc_url( circum_asset('assets/{path}') ); ?>"


def transform_content(html: str) -> str:
    def link_sub(m: re.Match) -> str:
        page = m.group("page").lower()
        hash_part = m.group("hash") or ""
        slug = "home" if page == "index" else page
        return f'href="{wp_url(slug, hash_part)}"'

    html = re.sub(r'href="([a-z0-9\-]+)\.html(#[^"]*)?"', link_sub, html, flags=re.I)

    def asset_sub(m: re.Match) -> str:
        return f'{m.group(1)}="{wp_asset(m.group(2))}"'

    html = re.sub(r'(src|href)="assets/([^"]+)"', asset_sub, html, flags=re.I)
    html = re.sub(r"<script[\s\S]*?</script>", "", html, flags=re.I)
    html = re.sub(r'<link href="css/[^"]+" rel="stylesheet"/>\s*', "", html)
    html = re.sub(r'<link as="image" href="[^"]+" rel="preload"/>\s*', "", html)
    html = re.sub(
        r'<link as="fetch" crossorigin="" href="[^"]+" rel="preload" type="video/mp4"/>\s*',
        "",
        html,
    )
    return html.strip()


def extract_body(html: str) -> str:
    m = re.search(r"<body[^>]*>([\s\S]*)</body>", html, re.I)
    return m.group(1) if m else html


def extract_main(html: str) -> str:
    body = extract_body(html)
    nav_mobile = body.find('class="nav-mobile"')
    if nav_mobile == -1:
        raise ValueError("nav-mobile missing")
    start = body.find("</div>", nav_mobile)
    start = body.find("</div>", start + 6) + 6

    markers = [
        body.find("<main", start),
        body.find('<section class="newsletter-strip">', start),
        body.find("<footer", start),
    ]
    markers = [m for m in markers if m != -1]
    end = min(markers) if markers else len(body)

    chunk = body[start:end].strip()
    if chunk.startswith("<main"):
        return chunk
    main_open = chunk.find("<main")
    if main_open != -1:
        return chunk[main_open:].strip()
    return f"<main class=\"page-content\">\n{chunk}\n</main>"


def extract_bottom_and_footer(html: str) -> tuple[str, str]:
    body = extract_body(html)
    nl = body.find('<section class="newsletter-strip">')
    ft = body.find("<footer")
    bottom = ""
    if nl != -1 and ft != -1:
        bottom = body[nl:ft].strip()
    footer = ""
    if ft != -1:
        footer = body[ft:].split("<script")[0].strip()
    return bottom, footer


def extract_head_styles(html: str) -> str:
    m = re.search(r"<style>([\s\S]*?)</style>", html, re.I)
    return m.group(0) if m else ""


def write_template(php_name: str, slug: str, main: str, inline_style: str = "") -> None:
    main = transform_content(main)
    style_hook = ""
    if inline_style:
        escaped = inline_style.replace("\\", "\\\\").replace("'", "\\'")
        style_hook = f"""
<?php add_action('wp_head', static function () {{ echo '{escaped}'; }}, 20); ?>
"""
    tpl = f"""<?php
/**
 * Page template: {slug}
 */
defined('ABSPATH') || exit;
{style_hook}
get_header();
?>
{main}
<?php get_footer();
"""
    (THEME / php_name).write_text(tpl, encoding="utf-8", newline="\n")


def build_header() -> str:
    raw = (SRC / "index.html").read_text(encoding="utf-8")
    body = extract_body(raw)
    nav_mobile = body.find('class="nav-mobile"')
    start = body.find('class="topbar"')
    end = body.find("</div>", nav_mobile)
    end = body.find("</div>", end + 6) + 6
    shell = transform_content(body[start:end])

    return f"""<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php circum_head_meta(); ?>
<?php circum_page_preloads(); ?>
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?> data-page="<?php echo esc_attr( circum_page_slug() ); ?>">
<?php wp_body_open(); ?>
{shell}
"""


def build_footer(bottom: str, footer: str) -> str:
    bottom = transform_content(bottom)
    footer = transform_content(footer)
    return f"""<?php if ( circum_show_bottom_sections() ) : ?>
{bottom}
<?php endif; ?>
{footer}
<?php wp_footer(); ?>
</body>
</html>
"""


def main() -> None:
    THEME.mkdir(parents=True, exist_ok=True)
    sync_assets()

    index = (SRC / "index.html").read_text(encoding="utf-8")
    bottom, footer = extract_bottom_and_footer(index)
    (THEME / "header.php").write_text(build_header(), encoding="utf-8", newline="\n")
    (THEME / "footer.php").write_text(build_footer(bottom, footer), encoding="utf-8", newline="\n")

    for html_name, (php_name, slug) in PAGES.items():
        path = SRC / html_name
        if not path.exists():
            continue
        html = path.read_text(encoding="utf-8")
        write_template(php_name, slug, extract_main(html), extract_head_styles(html))

    for html_file in THEME.glob("*.html"):
        html_file.unlink()

    print("OK:", THEME, "-", len(PAGES), "templates")


if __name__ == "__main__":
    main()
