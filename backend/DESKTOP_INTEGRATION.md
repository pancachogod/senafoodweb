# Desktop Integration

Production backend base URL:

```text
https://senafoodweb-production.up.railway.app
```

## Railway variables

In Railway, open the backend service, go to `Variables`, and make sure these values exist:

```env
DATABASE_URL=<postgres-connection-string>
JWT_SECRET=<long-random-secret>
CORS_ORIGINS=<frontend-origin-if-needed>
ADMIN_BOOTSTRAP_KEY=<long-random-secret>
```

After saving variables, redeploy or restart the backend service.

## Desktop app config

Set the desktop app API base URL to:

```env
API_BASE_URL=https://senafoodweb-production.up.railway.app
```

## Useful endpoints

- Health check: `GET /health`
- Create or promote admin: `POST /auth/admin/bootstrap`
- Login: `POST /auth/login`
- Validate delivery token: `POST /tokens/validate`

## Admin bootstrap request

Headers:

```http
X-Admin-Bootstrap-Key: <ADMIN_BOOTSTRAP_KEY>
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@senafood.com",
  "password": "Admin123",
  "name": "Admin SenaFood",
  "phone": "3000000000",
  "document": "1234567890"
}
```

## Token validation request

```json
{ "token": "ABC-12-34" }
```
