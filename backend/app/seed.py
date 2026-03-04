from sqlalchemy import select

from .db import SessionLocal
from .models import Product


SEED_PRODUCTS = [
    {
        "code": "pollo",
        "name": "Almuerzo Especial Pollo",
        "description": "Filete arroz, pollo a la plancha y ensalada fresca",
        "price": 9600,
        "image_url": None,
        "is_active": True,
    },
    {
        "code": "pescado",
        "name": "Almuerzo Especial Pescado",
        "description": "Filete arroz, tilapia y ensalada fresca",
        "price": 9500,
        "image_url": None,
        "is_active": True,
    },
]


def seed_products() -> int:
    created = 0
    with SessionLocal() as db:
        for item in SEED_PRODUCTS:
            existing = db.scalar(select(Product).where(Product.code == item["code"]))
            if existing:
                continue
            db.add(Product(**item))
            created += 1
        db.commit()
    return created


if __name__ == "__main__":
    count = seed_products()
    print(f"Seeded products: {count}")
