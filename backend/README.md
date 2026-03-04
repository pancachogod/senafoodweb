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
- Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Token validation

Desktop app should call `POST /tokens/validate` with a JSON body:

```json
{ "token": "ABC-12-34" }
```

If valid and unused, the order status becomes `Entregado`.
