# RetroPulse — Console Market SaaS

Plateforme SaaS bilingue (FR/EN) pour centraliser les annonces d'achat et de vente de consoles de jeux vidéo.

## Brand

- **Nom** : RetroPulse
- **Tagline FR** : Le pulse du marché des consoles
- **Tagline EN** : The pulse of the console market
- **Charte** : Dark retro-futuriste — cyan néon (#00f5ff), magenta (#ff006e), amber vintage (#ffb703), scanlines CRT, glass morphism

## Stack

- **Frontend** : React 19 + TypeScript + Vite + Tailwind CSS 4 + Framer Motion + i18next
- **Backend** : FastAPI + SQLite + SQLAlchemy

## Démarrage

```bash
# Backend (port 8000)
cd backend && pip install -r requirements.txt && uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Frontend (port 3000)
cd frontend && npm install && npm run dev
```

## Compte démo

- Email : `demo@retropulse.io`
- Mot de passe : `demo123`

## Fonctionnalités

- Landing page avec stats live et annonces en vedette
- Explorer les annonces avec filtres avancés (console, marque, type, prix, collector)
- Détail d'annonce avec watchlist
- Tableau de bord (watchlist, alertes prix)
- Publier une annonce (achat/vente)
- Tarification SaaS (Free / Pro / Collector)
- Bilingue FR/EN avec détection automatique
