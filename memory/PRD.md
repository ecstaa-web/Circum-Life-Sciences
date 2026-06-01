# Circum Life Sciences — Site refonte

## Original problem statement
> Prend le site internet que je t'ai lié sur mon github sur Circum, je veux que soigne le Header menu, rend le plus moderne, mais toujours dans le thème medical peut être ajouté un style liquid glass, et fais un système quadrilingue français / anglais / allemand / italien, la langue principale est le français.

## Source
- GitHub repo: https://github.com/ecstaa-web/Circumsitev4.git (already imported)
- Stack: Static HTML + CSS + Vanilla JS (no React, no DB)
- 10 pages: index, apropos, fondateurs, design, fabrication, clients, news, newsletter, carrieres, contact

## User decisions (Jan 2026)
- Liquid-glass style: **hybride** — glass-morphism subtil + animations fluides au scroll/hover
- Quadrilingue (FR/EN/DE/IT): **auto-détection navigateur + sélecteur manuel visible** (FR par défaut)
- Traductions: générées automatiquement (Claude Sonnet 4.6 via Emergent LLM key)
- i18n library: standard (custom lightweight implementation déjà en place)

## Architecture
- `/app/frontend/`
  - HTML pages with `data-i18n`, `data-i18n-html`, `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-alt` attributes
  - `css/main.css` — Liquid-glass header (lines 55-540)
  - `js/main.js` — Lang switcher (auto-detect + sliding indicator), scroll-state, mobile menu
  - `js/i18n/common.js` + `js/i18n/page-*.js` — Per-page translation dictionaries (4 langs)
  - `server.js` — Express static server on port 3000
- `/app/backend/server.py` — placeholder FastAPI (only `/api/health`)
- `/app/scripts/`
  - `retranslate.py` — One-off script that retranslated all FR strings with Claude Sonnet
  - `augment_i18n.py` / `augment_containers.py` — Added missing `data-i18n*` attributes to HTML

## What's been implemented (2026-01)
- **Liquid-glass Header**: floating rounded-capsule nav with `backdrop-filter: blur(22px) saturate(190%)`, soft inner highlight, animated under-edge gradient (blue→pink), pill-shaped hover state on links, glass sub-menus with subtle pink left-accent on hover, scroll-state (`.nav.scrolled` shrinks + intensifies glass), shimmer overlay
- **Refined Topbar**: dark gradient with radial pink/blue glow + animated bottom hairline; hidden on mobile; scrolls away with page
- **Sliding Language Pill (FR/EN/DE/IT)**: dynamically injected `.lang-indicator` animated with cubic-bezier easing on click & resize
- **Auto language detection on first visit**: reads `navigator.languages`, matches against FR/EN/DE/IT (defaults to FR)
- **Persistence**: localStorage key `circum.lang` (survives reloads + page navigation)
- **High-quality translations**: 11 page dicts + common dict re-translated by Claude Sonnet via Emergent LLM key (Swiss medical CDMO tone)
- **243 missing data-i18n attributes added** automatically by scanning HTML against FR dict and matching text content; container classes (prose-enhanced, highlight-quote, etc.) handled via positional matching
- **Mobile**: hamburger nav with full-glass off-canvas menu

## Test results
- Frontend testing agent — **100% pass** on requested feature set:
  - Liquid-glass capsule renders correctly
  - Sliding lang indicator works
  - Auto-detect first visit OK
  - Translations clean in FR/EN/DE/IT for hero/section/sub-titles across pages
  - Scroll-state class toggles properly
  - Dropdowns open on hover with translated items
  - Language persists across page navigation
  - Mobile viewport OK
- Minor cosmetic notes (addressed): removed an invalid `<link rel=preload as=video>` in index.html

## P0 / Future ideas
- Crawl every page once to flag any FR string with no matching key in CI (lint i18n keys)
- Optional: add a small flag icon next to each FR/EN/DE/IT label (currently text-only, intentionally minimal)
- Optional: extract CSS into per-component files if the file grows past ~2,500 lines
- Optional: animated hero video background can be re-enabled with `<link rel=preload as=fetch crossorigin>` for better browser support

## Next action items (backlog)
1. P1: Add a subtle "scroll progress" thin bar under the nav (medical aesthetic)
2. P1: Provide a screen-reader announcement when language changes (`aria-live="polite"`)
3. P2: Persist mobile menu state per session
4. P2: Add prefetch hints for the next-page nav links
