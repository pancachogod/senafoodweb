from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

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
def request_password_reset(
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
        return {"token": None, "email": None}
    token = create_password_reset_token(str(user.id))
    return {"token": token, "email": user.email}


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
