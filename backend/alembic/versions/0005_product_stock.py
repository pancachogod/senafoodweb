"""add stock to products

Revision ID: 0005_product_stock
Revises: 0004_email_verification_tokens
Create Date: 2026-03-17 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0005_product_stock"
down_revision = "0004_email_verification_tokens"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "stock",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )

    op.execute(
        sa.text(
            """
            UPDATE products
            SET stock = CASE
                WHEN code = 'pollo' THEN 12
                WHEN code = 'pescado' THEN 10
                ELSE stock
            END
            """
        )
    )


def downgrade() -> None:
    op.drop_column("products", "stock")
