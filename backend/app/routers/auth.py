from email.message import EmailMessage

import aiosmtplib
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import (
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetValidate,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserPublic,
    UserUpdate,
)
from ..security import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


async def send_password_reset_email(to_email: str, reset_link: str) -> None:
    settings = get_settings()
    if not settings.gmail_user or not settings.gmail_app_password:
        raise RuntimeError("Faltan GMAIL_USER o GMAIL_APP_PASSWORD")

    msg = EmailMessage()
    msg["From"] = f"SenaFood <{settings.gmail_user}>"
    msg["To"] = to_email
    msg["Subject"] = "Restablecer contrasena"
    msg.set_content("Abre este correo en un cliente que soporte HTML.")
    msg.add_alternative(
        f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.4;">
          <h2>Restablecer contrasena</h2>
          <p>Recibimos una solicitud para restablecer la contrasena de tu cuenta.</p>
          <p>
            <a href="{reset_link}"
               style="display:inline-block;padding:10px 14px;text-decoration:none;border-radius:10px;border:1px solid #ddd;">
              Crear nueva contrasena
            </a>
          </p>
          <p><b>Este enlace expirara en una hora.</b></p>
          <p>Si no solicitaste este cambio, ignora este correo.</p>
          <p>Saludos cordiales,</p>
        </div>
        """,
        subtype="html",
    )

    await aiosmtplib.send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.gmail_user,
        password=settings.gmail_app_password,
        timeout=20,
    )


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserPublic:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        document=payload.document,
        password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=user)


@router.post("/password/forgot")
async def request_password_reset(
    payload: PasswordResetRequest, db: Session = Depends(get_db)
) -> dict:
    value = payload.value.strip()
    if not value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valor invalido",
        )
    user = db.scalar(
        select(User).where(or_(User.email == value, User.document == value))
    )
    if not user or not user.is_active:
        return {
            "message": "Si el correo existe, te llegara un enlace de recuperacion.",
        }
    token = create_password_reset_token(str(user.id))
    settings = get_settings()
    base_url = settings.frontend_reset_url.strip()
    separator = "&" if "?" in base_url else "?"
    reset_link = f"{base_url}{separator}token={token}"
    try:
        await send_password_reset_email(user.email, reset_link)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo enviar el correo.",
        )
    return {"message": "Si el correo existe, te llegara un enlace de recuperacion."}


@router.post("/password/validate")
def validate_password_reset(
    payload: PasswordResetValidate, db: Session = Depends(get_db)
) -> dict:
    try:
        data = decode_password_reset_token(payload.token)
        subject = data.get("sub")
        user_id = int(subject) if subject is not None else None
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token invalido o expirado",
        )
    user = db.scalar(select(User).where(User.id == user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token invalido o expirado",
        )
    return {"valid": True}


@router.post("/password/reset")
def confirm_password_reset(
    payload: PasswordResetConfirm, db: Session = Depends(get_db)
) -> dict:
    try:
        data = decode_password_reset_token(payload.token)
        subject = data.get("sub")
        user_id = int(subject) if subject is not None else None
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token invalido o expirado",
        )
    user = db.scalar(select(User).where(User.id == user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token invalido o expirado",
        )
    user.password_hash = get_password_hash(payload.password)
    db.commit()
    return {"status": "ok"}


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return current_user


@router.patch("/me", response_model=UserPublic)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserPublic:
    if payload.name is not None:
        current_user.name = payload.name
    if payload.phone is not None:
        current_user.phone = payload.phone
    db.commit()
    db.refresh(current_user)
    return current_user
