import requests

from .config import get_settings

EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send"


def send_password_reset_email(to_email: str, to_name: str, reset_link: str) -> bool:
    settings = get_settings()
    if not (
        settings.emailjs_public_key
        and settings.emailjs_private_key
        and settings.emailjs_service_id
        and settings.emailjs_template_id
    ):
        return False

    payload = {
        "service_id": settings.emailjs_service_id,
        "template_id": settings.emailjs_template_id,
        "user_id": settings.emailjs_public_key,
        "accessToken": settings.emailjs_private_key,
        "template_params": {
            "to_email": to_email,
            "to_name": to_name,
            "email": to_email,
            "user_email": to_email,
            "from_name": "SENA FOOD",
            "reply_to": to_email,
            "reset_link": reset_link,
            "app_name": "SENA FOOD",
        },
    }

    response = requests.post(EMAILJS_ENDPOINT, json=payload, timeout=10)
    response.raise_for_status()
    return True
