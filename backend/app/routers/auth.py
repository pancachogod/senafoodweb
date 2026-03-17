import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Header, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..deps import get_current_user
from ..email import send_account_verification_email, send_password_reset_email
from ..models import EmailVerificationToken, PasswordResetToken, User
from ..schemas import (
    AdminBootstrapRequest,
    AdminBootstrapResponse,
    EmailVerificationConfirm,
    EmailVerificationResendRequest,
    EmailVerificationResponse,
    EmailVerificationStatus,
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetResponse,
    PasswordResetTokenStatus,
    PasswordResetTokenValidation,
    RegisterResponse,
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


def require_admin_bootstrap_key(
    x_admin_bootstrap_key: str | None = Header(
        default=None,
        alias="X-Admin-Bootstrap-Key",
    ),
) -> None:
    settings = get_settings()
    expected_key = settings.admin_bootstrap_key
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin bootstrap deshabilitado.",
        )
    if not x_admin_bootstrap_key or not secrets.compare_digest(
        x_admin_bootstrap_key,
        expected_key,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin bootstrap key invalida.",
        )


def build_verification_token(settings, user_id: int) -> tuple[str, EmailVerificationToken, str]:
    raw_token, token_hash = generate_password_reset_token()
    expire_minutes = settings.account_verification_expire_minutes
    if expire_minutes <= 0:
        expires_at = datetime.utcnow() + timedelta(days=365 * 100)
    else:
        expires_at = datetime.utcnow() + timedelta(minutes=expire_minutes)
    token_entry = EmailVerificationToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    verify_link = f"{settings.frontend_url}/verify?token={raw_token}"
    return raw_token, token_entry, verify_link


@router.post("/admin/bootstrap", response_model=AdminBootstrapResponse)
def bootstrap_admin_user(
    payload: AdminBootstrapRequest,
    response: Response,
    db: Session = Depends(get_db),
    _bootstrap: None = Depends(require_admin_bootstrap_key),
) -> AdminBootstrapResponse:
    email = str(payload.email).strip()
    name = payload.name.strip() if payload.name is not None else None
    phone = payload.phone.strip() if payload.phone is not None else None
    document = payload.document.strip() if payload.document is not None else None

    for label, raw_value, normalized_value in (
        ("name", payload.name, name),
        ("phone", payload.phone, phone),
        ("document", payload.document, document),
    ):
        if raw_value is not None and not normalized_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El campo {label} no puede estar vacio.",
            )

    user = db.scalar(select(User).where(User.email == email))
    created = user is None

    if created:
        missing_fields = [
            label
            for label, value in (
                ("name", name),
                ("phone", phone),
                ("document", document),
                ("password", payload.password),
            )
            if not value
        ]
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Faltan campos para crear el admin: "
                    f"{', '.join(missing_fields)}."
                ),
            )
        if not is_valid_password(payload.password or ""):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contrasena debe tener al menos 6 caracteres y una mayuscula.",
            )
        if db.scalar(select(User).where(User.phone == phone)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El telefono ya esta registrado.",
            )
        if db.scalar(select(User).where(User.document == document)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El documento ya esta registrado.",
            )

        user = User(
            name=name or "",
            email=email,
            phone=phone or "",
            document=document or "",
            password_hash=get_password_hash(payload.password or ""),
        )
        db.add(user)
        response.status_code = status.HTTP_201_CREATED
    else:
        if payload.password is not None:
            if not is_valid_password(payload.password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La contrasena debe tener al menos 6 caracteres y una mayuscula.",
                )
            user.password_hash = get_password_hash(payload.password)
        if name is not None:
            user.name = name
        if phone is not None and phone != user.phone:
            existing_phone = db.scalar(
                select(User).where(
                    User.phone == phone,
                    User.id != user.id,
                )
            )
            if existing_phone:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El telefono ya esta registrado.",
                )
            user.phone = phone
        if document is not None and document != user.document:
            existing_document = db.scalar(
                select(User).where(
                    User.document == document,
                    User.id != user.id,
                )
            )
            if existing_document:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El documento ya esta registrado.",
                )
            user.document = document


    user.role = "admin"
    user.is_active = True
    user.is_verified = True

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo, telefono o documento ya esta registrado.",
        ) from None

    return AdminBootstrapResponse(created=created, user=user)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> RegisterResponse:
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
        is_verified=False,
    )
    db.add(user)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo, telefono o documento ya esta registrado.",
        ) from None

    settings = get_settings()
    raw_token, token_entry, verify_link = build_verification_token(settings, user.id)
    db.add(token_entry)
    email_sent, error_message = send_account_verification_email(
        user.email,
        user.name,
        verify_link,
        raw_token,
    )

    db.commit()
    db.refresh(user)
    return RegisterResponse(
        user=user,
        email_sent=email_sent,
        verify_link=verify_link,
        error=error_message,
    )


@router.post("/verify/resend", response_model=EmailVerificationStatus)
def resend_email_verification(
    payload: EmailVerificationResendRequest,
    db: Session = Depends(get_db),
) -> EmailVerificationStatus:
    email = payload.email.strip()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo es obligatorio.",
        )
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        return EmailVerificationStatus(
            email_sent=False,
            error="No existe una cuenta con ese correo.",
        )
    if user.is_verified:
        return EmailVerificationStatus(
            email_sent=False,
            error="La cuenta ya esta verificada.",
        )

    settings = get_settings()
    raw_token, token_entry, verify_link = build_verification_token(settings, user.id)
    db.add(token_entry)
    email_sent, error_message = send_account_verification_email(
        user.email,
        user.name,
        verify_link,
        raw_token,
    )
    db.commit()
    return EmailVerificationStatus(
        email_sent=email_sent,
        verify_link=verify_link,
        error=error_message,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta no verificada. Revisa tu correo para activarla.",
        )

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=user)


@router.post("/verify/confirm", response_model=EmailVerificationResponse)
def confirm_email_verification(
    payload: EmailVerificationConfirm,
    db: Session = Depends(get_db),
) -> EmailVerificationResponse:
    token = payload.token.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace no es valido.",
        )
    token_hash = hash_token(token)
    token_entry = db.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash
        )
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
    settings = get_settings()
    if (
        settings.account_verification_expire_minutes > 0
        and token_entry.expires_at < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="El enlace ha expirado.",
        )

    user = token_entry.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no existe.",
        )
    user.is_verified = True
    token_entry.used_at = datetime.utcnow()
    db.commit()
    return EmailVerificationResponse()


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
