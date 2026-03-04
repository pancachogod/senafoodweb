from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_admin_user
from ..models import Product
from ..schemas import ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=list[ProductOut])
def list_products(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
) -> list[ProductOut]:
    query = select(Product)
    if not include_inactive:
        query = query.where(Product.is_active.is_(True))
    return list(db.scalars(query).all())


@router.post("/", response_model=ProductOut)
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
        is_active=payload.is_active,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
