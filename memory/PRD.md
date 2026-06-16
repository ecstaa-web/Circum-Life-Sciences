# Circum Life Sciences - Site Web

## Problem Statement
"Affiche moi le siteweb Circum dont je t'ai partagé via GitHub"
Repo: https://github.com/ecstaa-web/Circumsitev4 (branch: main, public)
Objectif initial: Cloner + intégrer dans la structure actuelle.
Itération 2: ajouter capture newsletter, news dynamique, candidature spontanée carrières.

## Architecture
- **Frontend** (`/app/frontend`): Site statique HTML/CSS/JS multi-pages (FR/EN/DE/IT) servi par Express sur port 3000 via `node server.js`. Géré par supervisor (`yarn start`).
- **Backend** (`/app/backend`): FastAPI + Motor (MongoDB) sur port 8001.
- **Database**: MongoDB local (`circum` db) avec collections: `news`, `newsletter_subscribers`, `careers_applications`.
- **Pages**: index, apropos, fondateurs, design, fabrication, clients, news, newsletter, carrieres, contact.

## API Endpoints
- `GET /api/health` — healthcheck
- `GET /api/news` — liste les actualités (6 seedées au startup)
- `POST /api/newsletter/subscribe` — JSON `{firstname, lastname, email, company?, role?, lang?, consent}` (idempotent par email)
- `POST /api/careers/apply` — multipart (firstname, lastname, email, phone?, position, location?, experience?, availability?, message?, consent, cv [PDF/DOC/DOCX max 10MB])
- `GET /api/careers/cv/{application_id}` — téléchargement CV (admin)

## Implementations
### 16 Jan 2026 — MVP
- Clone repo dans /app, install deps (yarn + pip), services UP.
- Site visible avec navigation multilingue FR/EN/DE/IT.

### 16 Jan 2026 — Features dynamiques
- Backend FastAPI étendu: 3 endpoints + seed 6 news au startup.
- `js/main.js`: `initForms()` remplacé pour faire de vrais POST (newsletter + careers + contact).
- `js/main.js`: `initDynamicNews()` charge `/api/news` et rend dynamiquement sur `body[data-page="news"]`.
- Fix critique i18n: `translatePage()` protège les containers contenant des form controls (ne traduit que le `<label>` enfant).
- Fix strip-form: `name="email"` ajouté sur 9 pages.
- Tests pytest backend 9/9 PASS, tests UI 100% PASS (iteration_3).

## Test data
- 6 news seedées (Force One, ISO 13485, Compamed, Livre blanc, INSA Lyon, Cleanroom C)
- CVs uploadés stockés dans `/app/backend/uploads/`

## Backlog / Next Items
- P1: Email notification (SendGrid/Resend) à chaque newsletter signup et candidature reçue
- P1: Admin endpoint protégé pour lister/exporter les subscribers + applications
- P2: Pagination/filtre sur `/api/news` (par tag, par année)
- P2: data-testid sur tous les messages succès pour assertions auto + bouton "désinscription" newsletter
- P2: Petit consent checkbox sur strip-form (RGPD)
- P3: Section blog (article complet par news)
