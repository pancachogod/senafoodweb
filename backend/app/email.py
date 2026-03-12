import requests

from .config import get_settings

EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send"


def send_password_reset_email(
    to_email: str,
    to_name: str,
    reset_link: str,
    reset_token: str | None = None,
) -> tuple[bool, str | None]:
    settings = get_settings()
    if not (
        settings.emailjs_public_key
        and settings.emailjs_private_key
        and settings.emailjs_service_id
        and settings.emailjs_template_id
    ):
        return False, "EmailJS no configurado en el backend."

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
            "name": to_name,
            "user_name": to_name,
            "from_email": to_email,
            "from_name": "SENA FOOD",
            "reply_to": to_email,
            "reset_link": reset_link,
            "resetLink": reset_link,
            "reset_url": reset_link,
            "resetUrl": reset_link,
            "token": reset_token or "",
            "reset_token": reset_token or "",
            "resetToken": reset_token or "",
            "app_name": "SENA FOOD",
        },
    }

    try:
        response = requests.post(EMAILJS_ENDPOINT, json=payload, timeout=10)
        response.raise_for_status()
    except requests.RequestException as exc:
        message = None
        if getattr(exc, "response", None) is not None:
            message = exc.response.text or None
        return False, message or str(exc)
    return True, None


def send_account_verification_email(
    to_email: str,
    to_name: str,
    verify_link: str,
    verify_token: str | None = None,
) -> tuple[bool, str | None]:
    settings = get_settings()
    template_id = settings.emailjs_verify_template_id or settings.emailjs_template_id
    service_id = settings.emailjs_verify_service_id or settings.emailjs_service_id
    if not (
        settings.emailjs_public_key
        and settings.emailjs_private_key
        and service_id
        and template_id
    ):
        return False, "EmailJS no configurado en el backend."

    payload = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": settings.emailjs_public_key,
        "accessToken": settings.emailjs_private_key,
        "template_params": {
            "to_email": to_email,
            "to_name": to_name,
            "email": to_email,
            "user_email": to_email,
            "name": to_name,
            "user_name": to_name,
            "from_email": to_email,
            "from_name": "SENA FOOD",
            "reply_to": to_email,
            "verify_link": verify_link,
            "verification_link": verify_link,
            "verifyLink": verify_link,
            "verify_url": verify_link,
            "verifyUrl": verify_link,
            "token": verify_token or "",
            "verify_token": verify_token or "",
            "verifyToken": verify_token or "",
            "app_name": "SENA FOOD",
        },
    }

    try:
        response = requests.post(EMAILJS_ENDPOINT, json=payload, timeout=10)
        response.raise_for_status()
    except requests.RequestException as exc:
        message = None
        if getattr(exc, "response", None) is not None:
            message = exc.response.text or None
        return False, message or str(exc)
    return True, None
