import os
from functools import lru_cache


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/senafood",
        )
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
