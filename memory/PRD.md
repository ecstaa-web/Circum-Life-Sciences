# Circum Life Sciences - Site Web

## Problem Statement
"Affiche moi le siteweb Circum dont je t'ai partagé via GitHub"
Repo: https://github.com/ecstaa-web/Circumsitev4 (branch: main, public)
Objectif: Cloner + intégrer dans la structure actuelle.

## Architecture
- **Frontend** (`/app/frontend`): Site statique HTML/CSS/JS multi-pages (FR/EN/DE/IT) servi par Express sur port 3000 via `node server.js`. Géré par supervisor (`yarn start`).
- **Backend** (`/app/backend`): FastAPI minimal exposant `/api/health`, sur port 8001.
- **Pages**: index, apropos, fondateurs, design, fabrication, clients, news, newsletter, carrieres, contact.
- **i18n**: Fichiers de traduction dans `/app/frontend/i18n/locales/`.

## Implementation (16 Jan 2026)
- Clone du repo dans /app, conservation de la structure d'origine du repo (backend FastAPI + frontend Express).
- `yarn install` dans frontend (express).
- `pip install` dans backend (fastapi 0.115.0, uvicorn 0.30.6).
- Restart supervisor: backend + frontend RUNNING.
- Vérifié: home `/` (HTTP 200), `/apropos.html` (HTTP 200), `/api/health` (HTTP 200).

## Backlog / Next Items
- Ajouter formulaire contact fonctionnel (backend route)
- Newsletter subscription (capture email)
- Section actualités dynamique
- Optimisations SEO / sitemap.xml
