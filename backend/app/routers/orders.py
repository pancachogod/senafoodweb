from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, load_only, selectinload

from ..db import get_db
from ..deps import get_current_user
from ..models import Order, OrderItem, Payment, Product, TokenValidator, User
from ..schemas import OrderCreate, OrderOut, OrderUpdate
from ..utils import generate_token

router = APIRouter(prefix="/orders", tags=["orders"])

ORDER_LOAD_OPTIONS = (
    selectinload(Order.user),
    selectinload(Order.items).selectinload(OrderItem.product),
    selectinload(Order.payments).load_only(
        Payment.id,
        Payment.order_id,
        Payment.method,
        Payment.amount,
        Payment.status,
        Payment.proof_filename,
        Payment.proof_mime,
        Payment.created_at,
    ),
)


def build_order_query():
    return select(Order).options(*ORDER_LOAD_OPTIONS)


def get_order_with_relations(db: Session, order_id: int) -> Order | None:
    return db.scalar(build_order_query().where(Order.id == order_id))


def _build_item_data(items: list, db: Session) -> tuple[list[dict], int, list[tuple[Product, int]]]:
    if not items:
        raise HTTPException(status_code=400, detail="Order must have items")

    built: list[dict] = []
    total = 0
    locked_products: dict[int, Product] = {}
    reserved_quantities: dict[int, int] = defaultdict(int)

    for item in items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Invalid quantity")

        if item.product_id:
            product = locked_products.get(item.product_id)
            if product is None:
                product = db.scalar(
                    select(Product)
                    .where(Product.id == item.product_id)
                    .with_for_update()
                )
                if product is not None:
                    locked_products[item.product_id] = product
            if not product or not product.is_active:
                raise HTTPException(status_code=400, detail="Invalid product")
            remaining_stock = product.stock - reserved_quantities[item.product_id]
            if remaining_stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Stock insuficiente para {product.name}. "
                        f"Disponibles: {max(remaining_stock, 0)}."
                    ),
                )
            reserved_quantities[item.product_id] += item.quantity
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

    stock_reservations = [
        (locked_products[product_id], quantity)
        for product_id, quantity in reserved_quantities.items()
    ]

    return built, total, stock_reservations


def restore_product_stock(order: Order) -> None:
    for item in order.items:
        if item.product is None:
            continue
        item.product.stock += item.quantity


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderOut:
    for attempt in range(5):
        items_data, total, stock_reservations = _build_item_data(payload.items, db)
        for product, quantity in stock_reservations:
            product.stock -= quantity

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


@router.get("", response_model=list[OrderOut])
def list_orders(
    all: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrderOut]:
    if all and current_user.role == "admin":
        query = build_order_query().order_by(Order.created_at.desc())
    else:
        query = (
            build_order_query()
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
    order = get_order_with_relations(db, order_id)
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
    order = get_order_with_relations(db, order_id)
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

    if order.status == "Cancelado" and payload.status != "Cancelado":
        raise HTTPException(status_code=400, detail="Cancelled order cannot be reopened")
    if order.status == "Entregado" and payload.status != "Entregado":
        raise HTTPException(status_code=400, detail="Delivered order cannot change status")

    if payload.status == "Cancelado" and order.status != "Cancelado":
        restore_product_stock(order)

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order
