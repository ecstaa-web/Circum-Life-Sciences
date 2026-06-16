# Circum Life Sciences - Site Web

## Problem Statement
Repo: https://github.com/ecstaa-web/Circumsitev4 — site statique HTML/JS multi-pages (FR/EN/DE/IT).
Itérations:
1. Cloner + intégrer + afficher.
2. Newsletter fonctionnelle, news dynamique, candidatures spontanées carrières.
3. Endpoint admin protégé (Emergent Google Auth + allow-list) avec exports CSV+JSON et page admin.

## Architecture
- **Frontend** (`/app/frontend`): Site statique servi par Express (port 3000) via `node server.js`. `admin.html` est une page séparée vanilla JS.
- **Backend** (`/app/backend`): FastAPI + Motor (port 8001). Auth Emergent (cookie session_token httpOnly+secure+SameSite=None, TTL 7j) ou Bearer token.
- **Database**: MongoDB `circum` — collections: `news`, `newsletter_subscribers`, `careers_applications`, `users`, `user_sessions`, `admin_allowlist`.
- **CV uploads**: `/app/backend/uploads/`.

## API Endpoints
### Public
- `GET /api/health`
- `GET /api/news` — 6 items seedés
- `POST /api/newsletter/subscribe` (idempotent par email)
- `POST /api/careers/apply` (multipart, CV PDF/DOC/DOCX ≤10MB)

### Auth (Emergent Google)
- `POST /api/auth/google/exchange` `{session_id}` → cookie httpOnly + user
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Admin (require_admin: session + email dans allow-list)
- `GET /api/admin/leads` / `.csv` / `.json`
- `GET /api/admin/applications` / `.csv` / `.json`
- `GET /api/careers/cv/{id}` (download CV)
- `GET /api/admin/allowlist` — liste admins
- `POST /api/admin/allowlist` — ajouter admin
- `DELETE /api/admin/allowlist/{email}` — retirer (protections: pas soi-même, pas le dernier)

## Frontend pages
- 10 pages publiques (index, apropos, fondateurs, design, fabrication, clients, news, newsletter, carrieres, contact)
- `/admin.html` — login Google + dashboard (stats, tableaux leads/candidatures, boutons CSV/JSON, gestion admins)

## Implementations
### 16 Jan 2026 — MVP
- Clone, install, services UP. Site visible en 4 langues.

### 16 Jan 2026 — Features dynamiques (iteration 2-3)
- 3 endpoints backend + seed news, 100% PASS aux tests.
- Fix critique i18n + name=email sur strip-form.

### 16 Jan 2026 — Admin module (iteration 4)
- Emergent Google Auth en flow complet (exchange via demobackend.emergentagent.com).
- Allow-list stockée en DB, gérable via UI (ajout/suppression), seedée avec `stag3@circumlifesciences.com`.
- Endpoints admin protégés + exports CSV/JSON.
- Page admin vanilla JS avec design Circum (bleu #205a99, rose #f365b4).
- 31/31 tests backend + 6/6 phases UI PASS.

## Backlog
- P1: Notifications email (SendGrid/Resend) à chaque nouveau lead/candidature
- P1: Audit log (qui a ajouté/retiré un admin et quand) — déjà présent sur add (champ `added_by`), à étendre sur delete
- P2: Pagination + recherche sur les tableaux admin (au-delà de 1000 leads)
- P2: Filtre par date/source dans les exports
- P2: Suppression de leads/candidatures (RGPD) depuis l'UI
- P3: Statistiques avancées (graphe inscriptions/mois)
- P3: API publique d'archive newsletter (issues précédentes)
