# Auth-Gated App Testing Playbook (Emergent Google Auth)

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('circum');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'stag3@circumlifesciences.com',
  name: 'Test Admin',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
APP=https://b709274e-5200-48ec-baa8-751e87349ea7.preview.emergentagent.com

# Auth check
curl -s -X GET "$APP/api/auth/me" -H "Authorization: Bearer $TOKEN"

# Admin lists
curl -s "$APP/api/admin/leads" -H "Authorization: Bearer $TOKEN"
curl -s "$APP/api/admin/applications" -H "Authorization: Bearer $TOKEN"

# Exports
curl -s "$APP/api/admin/leads.csv" -H "Authorization: Bearer $TOKEN" -o /tmp/leads.csv
curl -s "$APP/api/admin/applications.json" -H "Authorization: Bearer $TOKEN" -o /tmp/apps.json

# Allowlist
curl -s "$APP/api/admin/allowlist" -H "Authorization: Bearer $TOKEN"
```

## Step 3: Browser Testing
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "b709274e-5200-48ec-baa8-751e87349ea7.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://b709274e-5200-48ec-baa8-751e87349ea7.preview.emergentagent.com/admin.html")
```

## Allow-list
- Default seeded admin: `stag3@circumlifesciences.com`
- Admins can add/remove other admins via the admin UI or `POST/DELETE /api/admin/allowlist`.
- At least one admin must remain at all times (deletion of last admin is blocked).

## Cleanup
```bash
mongosh --eval "use('circum'); db.users.deleteMany({email:/test/}); db.user_sessions.deleteMany({session_token:/test_/});"
```
