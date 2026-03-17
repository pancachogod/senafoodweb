from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Order, Payment, User
from ..schemas import PaymentOut

router = APIRouter(prefix="/payments", tags=["payments"])


def ensure_payment_access(payment: Payment, current_user: User) -> None:
    if current_user.role != "admin" and payment.order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("", response_model=PaymentOut)
async def create_payment(
    order_id: int = Form(...),
    method: str = Form(...),
    amount: int = Form(...),
    status: str = Form("Pendiente"),
    proof: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentOut:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    proof_bytes = None
    proof_filename = None
    proof_mime = None
    if proof:
        proof_bytes = await proof.read()
        proof_filename = proof.filename or f"payment-{order_id}-proof"
        proof_mime = proof.content_type or "application/octet-stream"

    payment = Payment(
        order_id=order_id,
        method=method,
        amount=amount,
        status=status,
        proof_filename=proof_filename,
        proof_mime=proof_mime,
        proof_data=proof_bytes,
    )
    order.payment_method = method

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/{payment_id}/proof")
def get_payment_proof(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    ensure_payment_access(payment, current_user)

    if payment.proof_data is None:
        raise HTTPException(status_code=404, detail="Payment proof not found")

    headers = {}
    if payment.proof_filename:
        headers["Content-Disposition"] = (
            f'inline; filename="{payment.proof_filename}"'
        )

    return Response(
        content=payment.proof_data,
        media_type=payment.proof_mime or "application/octet-stream",
        headers=headers,
    )
