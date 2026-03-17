# Sena Food Backend

FastAPI backend with PostgreSQL for users, products, orders, payments, and token validation.

## Requirements

- Python 3.11+
- PostgreSQL

## Local setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

The backend reads `backend/.env` automatically on startup.

## PostgreSQL with Docker

From the repo root:

```bash
docker compose up -d db
```

Then use this in `backend/.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/senafood
```

## Database

Create the database, then run migrations:

```bash
alembic upgrade head
```

On Railway, the app now applies pending migrations automatically when the service starts.

## Seed products

```bash
python -m app.seed
```

## Run the API

```bash
uvicorn app.main:app --reload
```

## Railway

- Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` in Railway variables.
- For one-time admin bootstrap, also set `ADMIN_BOOTSTRAP_KEY` with a long random value.
- For the current production URL and desktop client setup, see `backend/DESKTOP_INTEGRATION.md`.
- Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Bootstrap admin

Use this endpoint to create or promote an admin user without direct database access:

```http
POST /auth/admin/bootstrap
X-Admin-Bootstrap-Key: <ADMIN_BOOTSTRAP_KEY>
Content-Type: application/json
```

Request body:

```json
{
  "email": "carlos.admin@senafood.com",
  "password": "Admin123",
  "name": "Carlos Admin",
  "phone": "3000000000",
  "document": "1234567890"
}
```

- If the user exists, the endpoint promotes it to `admin` and updates the password only when `password` is sent.
- If the user does not exist, it creates the account as verified admin. In that case `name`, `phone`, `document`, and `password` are required.
- If the route responds with `403 Admin bootstrap deshabilitado.`, add `ADMIN_BOOTSTRAP_KEY` to `backend/.env` locally or to your deploy environment variables.
- Remove or rotate `ADMIN_BOOTSTRAP_KEY` after using it.

## Token validation

Desktop app should call `POST /tokens/validate` with a JSON body:

```json
{ "token": "ABC-12-34" }
```

If valid and unused, the order status becomes `Entregado` and the latest payment status is updated as well.

To display a saved payment proof from desktop, read `latest_payment.proof_url` from `GET /orders?all=true` and request that path with the same bearer token used by the admin session.

## Product stock

- `GET /products` now returns `stock` for each product.
- Admin clients such as the desktop app can update stock with `PATCH /products/code/{code}`.
- When stock reaches `0`, the web disables purchases for that product.
