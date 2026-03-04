import secrets

TOKEN_POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"


def _segment(length: int) -> str:
    return "".join(secrets.choice(TOKEN_POOL) for _ in range(length))


def generate_token() -> str:
    return f"{_segment(3)}-{_segment(2)}-{_segment(2)}"
