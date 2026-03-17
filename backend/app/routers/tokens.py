from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Order, TokenValidator
from ..schemas import TokenValidationRequest, TokenValidationResponse

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.post("/validate", response_model=TokenValidationResponse)
def validate_token(
    payload: TokenValidationRequest,
    db: Session = Depends(get_db),
) -> TokenValidationResponse:
    token_entry = db.scalar(
        select(TokenValidator).where(TokenValidator.token == payload.token)
    )
    if not token_entry:
        raise HTTPException(status_code=404, detail="Token not found")
    if token_entry.is_used:
        raise HTTPException(status_code=409, detail="Token already used")

    token_entry.is_used = True
    token_entry.used_at = datetime.utcnow()

    order = token_entry.order
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = "Entregado"
    latest_payment = order.latest_payment
    if latest_payment and latest_payment.status != "Entregado":
        latest_payment.status = "Entregado"
    db.commit()
    db.refresh(order)

    return TokenValidationResponse(order=order, validated_at=token_entry.used_at)
