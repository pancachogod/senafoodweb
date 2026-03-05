import os
from functools import lru_cache


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def normalize_origin(origin: str) -> str:
    origin = origin.strip()
    if not origin:
        return ""
    if origin == "*":
        return origin
    if origin.endswith("/"):
        origin = origin[:-1]
    if origin.startswith("http://") or origin.startswith("https://"):
        return origin
    if origin.startswith("localhost") or origin.startswith("127.0.0.1"):
        return f"http://{origin}"
    return f"https://{origin}"


def parse_cors_origins(raw: str) -> list[str]:
    if not raw:
        return []
    origins: list[str] = []
    for item in raw.split(","):
        origin = normalize_origin(item)
        if not origin:
            continue
        if origin == "*":
            return ["*"]
        origins.append(origin)
    return origins


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
        self.password_reset_expire_minutes = int(
            os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "60")
        )
        self.gmail_user = os.getenv("GMAIL_USER", "")
        self.gmail_app_password = os.getenv("GMAIL_APP_PASSWORD", "")
        self.frontend_reset_url = os.getenv(
            "FRONTEND_RESET_URL",
            "https://senafoodweb.vercel.app/forgot/sent",
        )
        cors_env = os.getenv("CORS_ORIGINS", "")
        self.cors_origins = parse_cors_origins(cors_env)
        self.env = os.getenv("ENV", "dev")


@lru_cache
def get_settings() -> Settings:
    return Settings()
