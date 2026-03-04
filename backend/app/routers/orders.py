from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Order, OrderItem, Product, TokenValidator, User
from ..schemas import OrderCreate, OrderOut, OrderUpdate
from ..utils import generate_token

router = APIRouter(prefix="/orders", tags=["orders"])


def _build_item_data(items: list, db: Session) -> tuple[list[dict], int]:
    if not items:
        raise HTTPException(status_code=400, detail="Order must have items")

    built: list[dict] = []
    total = 0
    for item in items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Invalid quantity")

        if item.product_id:
            product = db.get(Product, item.product_id)
            if not product or not product.is_active:
                raise HTTPException(status_code=400, detail="Invalid product")
            name = product.name
            description = product.description
            price = product.price
            image_url = product.image_url
        else:
            if item.name is None or item.price is None:
                raise HTTPException(
                    status_code=400,
                    detail="Missing item name or price",
                )
            name = item.name
            description = item.description or ""
            price = item.price
            image_url = item.image_url

        total += price * item.quantity
        built.append(
            {
                "product_id": item.product_id,
                "name": name,
                "description": description,
                "price": price,
                "image_url": image_url,
                "quantity": item.quantity,
            }
        )

    return built, total


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderOut:
    items_data, total = _build_item_data(payload.items, db)

    for attempt in range(5):
        token = generate_token()
        order = Order(
            user_id=current_user.id,
            status="Pendiente",
            payment_method=payload.payment_method or "Nequi",
            total=total,
            token=token,
        )
        order.items = [OrderItem(**item) for item in items_data]
        token_entry = TokenValidator(token=token, order=order)

        db.add(order)
        db.add(token_entry)

        try:
            db.commit()
            db.refresh(order)
            return order
        except IntegrityError:
            db.rollback()
            if attempt == 4:
                raise HTTPException(
                    status_code=500, detail="Could not generate unique token"
                )

    raise HTTPException(status_code=500, detail="Could not create order")


@router.get("/", response_model=list[OrderOut])
def list_orders(
    all: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrderOut]:
    if all and current_user.role == "admin":
        query = select(Order).order_by(Order.created_at.desc())
    else:
        query = (
            select(Order)
            .where(Order.user_id == current_user.id)
            .order_by(Order.created_at.desc())
        )
    return list(db.scalars(query).all())


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderOut:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return order


@router.patch("/{order_id}", response_model=OrderOut)
def update_order(
    order_id: int,
    payload: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderOut:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if payload.status not in {"Pendiente", "Cancelado", "Entregado"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    if current_user.role != "admin":
        if order.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        if payload.status != "Cancelado":
            raise HTTPException(status_code=403, detail="Only cancel allowed")
        if order.status == "Entregado":
            raise HTTPException(status_code=400, detail="Order already delivered")

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order
