import os
from functools import lru_cache


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Settings:
    def __init__(self) -> None:
        raw_url = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/senafood",
        )
        self.database_url = normalize_database_url(raw_url)
        self.jwt_secret = os.getenv("JWT_SECRET", "change-me")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
        )
        cors_env = os.getenv("CORS_ORIGINS", "")
        self.cors_origins = [
            origin.strip() for origin in cors_env.split(",") if origin.strip()
        ]
        self.env = os.getenv("ENV", "dev")


@lru_cache
def get_settings() -> Settings:
    return Settings()
