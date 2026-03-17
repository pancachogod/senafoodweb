import os
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import auth, orders, payments, products, tokens

settings = get_settings()
BACKEND_ROOT = Path(__file__).resolve().parents[1]


def should_run_migrations_on_startup() -> bool:
    return os.getenv("RUN_DB_MIGRATIONS_ON_STARTUP") == "1" or bool(os.getenv("PORT"))


def run_pending_migrations() -> None:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    command.upgrade(config, "head")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if should_run_migrations_on_startup():
        run_pending_migrations()
    yield

app = FastAPI(title="Sena Food Backend", version="1.0.0", lifespan=lifespan)

allow_origins = settings.cors_origins

if not allow_origins or allow_origins == ["*"]:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(tokens.router)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
