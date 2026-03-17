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
- List products with stock: `GET /products`
- List all orders as admin: `GET /orders?all=true`
- Create or promote admin: `POST /auth/admin/bootstrap`
- Login: `POST /auth/login`
- Update stock by product code: `PATCH /products/code/{code}`
- Validate delivery token: `POST /tokens/validate`
- View payment proof image: `GET /payments/{payment_id}/proof`

`GET /orders?all=true` now includes `latest_payment`, and when a proof exists it exposes a relative `proof_url` like `/payments/15/proof`.
Use the backend base URL plus that path and send the same bearer token from the admin login.

`GET /products` now includes `stock`. When the desktop app updates stock, the web menu reflects it automatically because both apps read the same backend data.

Example stock update request:

```http
PATCH /products/code/pollo
Authorization: Bearer <admin_token>
Content-Type: application/json
```

```json
{
  "stock": 8
}
```

When stock reaches `0`, the web blocks new purchases for that product.

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

When the token is validated, the order status changes to `Entregado` and the latest payment status is updated too.
