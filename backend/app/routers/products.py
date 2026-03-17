from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_admin_user
from ..models import Product
from ..schemas import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def apply_product_updates(product: Product, payload: ProductUpdate) -> Product:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(product, field, value)
    return product


def get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def get_product_by_code_or_404(db: Session, product_code: str) -> Product:
    product = db.scalar(select(Product).where(Product.code == product_code))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("", response_model=list[ProductOut])
def list_products(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
) -> list[ProductOut]:
    query = select(Product).order_by(Product.created_at.asc(), Product.id.asc())
    if not include_inactive:
        query = query.where(Product.is_active.is_(True))
    return list(db.scalars(query).all())


@router.post("", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_user),
) -> ProductOut:
    product = Product(
        name=payload.name,
        description=payload.description or "",
        price=payload.price,
        image_url=payload.image_url,
        code=payload.code,
        stock=payload.stock,
        is_active=payload.is_active,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/code/{product_code}", response_model=ProductOut)
def update_product_by_code(
    product_code: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_user),
) -> ProductOut:
    product = get_product_by_code_or_404(db, product_code)
    apply_product_updates(product, payload)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_user),
) -> ProductOut:
    product = get_product_or_404(db, product_id)
    apply_product_updates(product, payload)
    db.commit()
    db.refresh(product)
    return product
