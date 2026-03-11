import hashlib
import secrets

TOKEN_POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"


def _segment(length: int) -> str:
    return "".join(secrets.choice(TOKEN_POOL) for _ in range(length))


def generate_token() -> str:
    return f"{_segment(3)}-{_segment(2)}-{_segment(2)}"


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_password_reset_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)
