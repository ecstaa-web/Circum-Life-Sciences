# Test Credentials — Circum Life Sciences

> **Do not commit real passwords.** Store secrets only in `.env` (see `.env.example`).

## Admin Login

### Email + password
- **URL** : `/admin.html`
- **Email** : value of `DEFAULT_ADMIN_EMAIL` in `.env`
- **Password** : value of `ADMIN_PASSWORD` in `.env` (required in production)

### Google OAuth (Emergent Auth)
- Button on `/admin.html`
- Google account must be in `admin_allowlist`

## Automated test sessions

Create a Bearer session via mongosh (no password needed):

```bash
mongosh --quiet --eval "
use('circum');
var u = db.users.findOne({email:'YOUR_ADMIN_EMAIL'});
if(!u){print('NO_ADMIN'); quit();}
var t='test_session_'+Date.now();
db.user_sessions.insertOne({
  user_id: u.user_id,
  session_token: t,
  csrf_token: 'test_csrf_'+Date.now(),
  expires_at: new Date(Date.now()+7*24*60*60*1000),
  created_at: new Date()
});
print(t);
"
```

For cookie-based admin UI tests, use login flow or copy `csrf_token` from `/api/auth/me` after login.
