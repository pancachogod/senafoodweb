from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..deps import get_current_user
from ..email import send_password_reset_email
from ..models import PasswordResetToken, User
from ..schemas import (
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetResponse,
    PasswordResetTokenStatus,
    PasswordResetTokenValidation,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserPublic,
    UserUpdate,
)
from ..security import (
    create_access_token,
    get_password_hash,
    is_valid_password,
    verify_password,
)
from ..utils import generate_password_reset_token, hash_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserPublic:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya esta registrado.",
        )
    existing_phone = db.scalar(select(User).where(User.phone == payload.phone))
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El telefono ya esta registrado.",
        )
    existing_document = db.scalar(select(User).where(User.document == payload.document))
    if existing_document:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El documento ya esta registrado.",
        )
    if not is_valid_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contrasena debe tener al menos 6 caracteres y una mayuscula.",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        document=payload.document,
        password_hash=get_password_hash(payload.password),
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo, telefono o documento ya esta registrado.",
        ) from None
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


@router.post("/password/change")
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contrasena actual no es correcta.",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contrasena debe ser diferente.",
        )
    if not is_valid_password(payload.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contrasena debe tener al menos 6 caracteres y una mayuscula.",
        )
    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"status": "ok"}


@router.post("/password-reset/request", response_model=PasswordResetResponse)
def request_password_reset(
    payload: PasswordResetRequest,
    db: Session = Depends(get_db),
) -> PasswordResetResponse:
    identifier = payload.identifier.strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo o documento es obligatorio.",
        )

    user = None
    if "@" in identifier:
        user = db.scalar(select(User).where(User.email == identifier))
    if not user:
        user = db.scalar(select(User).where(User.document == identifier))

    if user:
        settings = get_settings()
        raw_token, token_hash = generate_password_reset_token()
        expire_minutes = settings.password_reset_expire_minutes
        if expire_minutes <= 0:
            expires_at = datetime.utcnow() + timedelta(days=365 * 100)
        else:
            expires_at = datetime.utcnow() + timedelta(minutes=expire_minutes)
        token_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(token_entry)
        db.commit()

        reset_link = f"{settings.frontend_url}/reset?token={raw_token}"
        email_sent, error_message = send_password_reset_email(
            user.email,
            user.name,
            reset_link,
            raw_token,
        )
        return PasswordResetResponse(
            email_sent=email_sent,
            reset_link=None if email_sent else reset_link,
            error=error_message,
        )

    return PasswordResetResponse()


@router.post("/password-reset/validate", response_model=PasswordResetTokenStatus)
def validate_password_reset_token(
    payload: PasswordResetTokenValidation,
    db: Session = Depends(get_db),
) -> PasswordResetTokenStatus:
    token = payload.token.strip()
    if not token:
        return PasswordResetTokenStatus(valid=False)
    token_hash = hash_token(token)
    token_entry = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )
    if not token_entry:
        return PasswordResetTokenStatus(valid=False)
    if token_entry.used_at:
        return PasswordResetTokenStatus(valid=False)
    return PasswordResetTokenStatus(valid=True, expires_at=token_entry.expires_at)


@router.post("/password-reset/confirm", response_model=PasswordResetResponse)
def confirm_password_reset(
    payload: PasswordResetConfirm,
    db: Session = Depends(get_db),
) -> PasswordResetResponse:
    token = payload.token.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace no es valido.",
        )
    token_hash = hash_token(token)
    token_entry = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )
    if not token_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El enlace no es valido.",
        )
    if token_entry.used_at:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El enlace ya fue usado.",
        )
    if not is_valid_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contrasena debe tener al menos 6 caracteres y una mayuscula.",
        )

    user = token_entry.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no existe.",
        )
    user.password_hash = get_password_hash(payload.password)
    token_entry.used_at = datetime.utcnow()
    db.commit()
    return PasswordResetResponse()


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
        existing_phone = db.scalar(
            select(User).where(
                User.phone == payload.phone,
                User.id != current_user.id,
            )
        )
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El telefono ya esta registrado.",
            )
        current_user.phone = payload.phone
    try:
        db.commit()
        db.refresh(current_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El telefono ya esta registrado.",
        ) from None
    return current_user
