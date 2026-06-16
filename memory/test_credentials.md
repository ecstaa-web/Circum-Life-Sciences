# Test Credentials — Circum Life Sciences

## Admin (Emergent Google Auth)

### Default seeded admin (allow-list)
- **Email:** `stag3@circumlifesciences.com`
- This email must own a Google account to actually log in via https://auth.emergentagent.com
- The allow-list is stored in MongoDB collection `admin_allowlist` and can be managed via the admin UI (`/admin.html`)

### Test session (for automated testing via Bearer token)
The test session below is created by the test setup script (regenerated per run, see `/app/auth_testing.md`).

To create a fresh test session manually:
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

Then use the token returned as Bearer:
```bash
curl -H "Authorization: Bearer <TOKEN>" https://b709274e-5200-48ec-baa8-751e87349ea7.preview.emergentagent.com/api/auth/me
```

Or set as cookie for browser-based UI testing:
```python
await page.context.add_cookies([{
  "name": "session_token", "value": "<TOKEN>",
  "domain": "b709274e-5200-48ec-baa8-751e87349ea7.preview.emergentagent.com",
  "path": "/", "httpOnly": True, "secure": True, "sameSite": "None"
}])
```

## Allow-list management
- Add admin: `POST /api/admin/allowlist` `{"email":"new@circumlifesciences.com"}`
- Remove admin: `DELETE /api/admin/allowlist/<email>` (cannot remove self, cannot remove last admin)
- List admins: `GET /api/admin/allowlist`

## Cleanup
```bash
mongosh --quiet --eval "use('circum'); db.user_sessions.deleteMany({session_token:/^test_session_/}); db.users.deleteMany({user_id:'user_test_admin'});"
```
