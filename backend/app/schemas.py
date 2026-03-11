from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    document: str
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None


class UserPublic(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    document: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class PasswordResetRequest(BaseModel):
    identifier: str


class PasswordResetResponse(BaseModel):
    status: str = "ok"


class PasswordResetConfirm(BaseModel):
    token: str
    password: str = Field(min_length=6)


class PasswordResetTokenValidation(BaseModel):
    token: str


class PasswordResetTokenStatus(BaseModel):
    valid: bool
    expires_at: datetime | None = None


class ProductCreate(BaseModel):
    name: str
    description: str | None = ""
    price: int
    image_url: str | None = None
    code: str | None = None
    is_active: bool = True


class ProductOut(BaseModel):
    id: int
    name: str
    description: str
    price: int
    image_url: str | None
    code: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: int | None = None
    name: str | None = None
    description: str | None = ""
    price: int | None = None
    image_url: str | None = None
    quantity: int = Field(gt=0)


class OrderItemOut(BaseModel):
    id: int
    product_id: int | None
    name: str
    description: str
    price: int
    image_url: str | None
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    payment_method: str | None = "Nequi"


class OrderOut(BaseModel):
    id: int
    status: str
    payment_method: str
    total: int
    token: str
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut]
    user: UserPublic

    model_config = ConfigDict(from_attributes=True)


class OrderUpdate(BaseModel):
    status: str


class PaymentOut(BaseModel):
    id: int
    order_id: int
    method: str
    amount: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenValidationRequest(BaseModel):
    token: str


class TokenValidationResponse(BaseModel):
    order: OrderOut
    validated_at: datetime
    meta: dict[str, Any] | None = None
