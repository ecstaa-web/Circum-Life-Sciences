# Test Credentials — Circum Life Sciences

## Admin Login (deux méthodes)

### 1. Email + Mot de passe (NEW)
- **URL** : `/admin.html`
- **Email** : `stag3@circumlifesciences.com`
- **Mot de passe** : `Stag3Admin2026!`
- Définit dans `/app/backend/.env` (`ADMIN_PASSWORD`), seedé via bcrypt au startup.
- Crée la même session_token cookie (httpOnly, secure, SameSite=None, 7j) que l'auth Google.
- Protection brute-force : 5 tentatives échouées → lockout 15 minutes par couple `ip:email`.

### 2. Google OAuth (Emergent Auth)
- Bouton "Se connecter avec Google" sur `/admin.html`.
- Email Google doit être dans `admin_allowlist` (gérable depuis l'UI).
- Email allow-listé par défaut : `stag3@circumlifesciences.com` (mais comme ce n'est pas un vrai compte Google, utilisez plutôt le login email/password).

## Bypass pour tests automatisés
Création de session via mongosh (sans connaître le mot de passe) :
```bash
mongosh --quiet --eval "
use('circum');
var userId='user_test_admin';
var token='test_session_'+Date.now();
db.users.replaceOne({user_id:userId},
  {user_id:userId, email:'stag3@circumlifesciences.com', name:'Test Admin', picture:null, created_at:new Date()},
  {upsert:true});
db.user_sessions.insertOne({user_id:userId, session_token:token, expires_at:new Date(Date.now()+7*24*60*60*1000), created_at:new Date()});
print(token);
"
```

Utilisable comme Bearer ou cookie :
```bash
curl -H "Authorization: Bearer <TOKEN>" https://b709274e-5200-48ec-baa8-751e87349ea7.preview.emergentagent.com/api/auth/me
```

## Allow-list management
- `GET /api/admin/allowlist` — liste
- `POST /api/admin/allowlist` `{"email":"x@y.com"}` — ajouter
- `DELETE /api/admin/allowlist/<email>` — retirer (garde-fous: pas soi-même, pas le dernier)

## Newsletter issues CRUD (NEW)
- `GET /api/newsletter/issues` (public)
- `GET /api/admin/newsletter/issues` (admin, identique au public)
- `POST /api/admin/newsletter/issues` `{quarter, year, date, title, summary, link?}`
- `PUT /api/admin/newsletter/issues/{id}` (mêmes champs)
- `DELETE /api/admin/newsletter/issues/{id}`

## Cleanup
```bash
mongosh --quiet --eval "use('circum'); db.user_sessions.deleteMany({session_token:/^test_session_/}); db.login_attempts.deleteMany({});"
```

## Auth endpoints summary
- `POST /api/auth/login` `{email, password}` → session cookie
- `POST /api/auth/google/exchange` `{session_id}` → session cookie
- `GET /api/auth/me`
- `POST /api/auth/logout`
