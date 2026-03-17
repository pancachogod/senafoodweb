"""backfill product codes for known menu items

Revision ID: 0006_backfill_product_codes
Revises: 0005_product_stock
Create Date: 2026-03-17 00:30:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0006_backfill_product_codes"
down_revision = "0005_product_stock"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE products
            SET code = 'pollo'
            WHERE code IS NULL
              AND lower(name) LIKE '%pollo%'
            """
        )
    )

    op.execute(
        sa.text(
            """
            UPDATE products
            SET code = 'pescado'
            WHERE code IS NULL
              AND (
                lower(name) LIKE '%pescado%'
                OR lower(name) LIKE '%tilapia%'
              )
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE products
            SET code = NULL
            WHERE code IN ('pollo', 'pescado')
            """
        )
    )
