"""add unique user phone and document

Revision ID: 0002_unique_user_fields
Revises: 0001_initial
Create Date: 2026-03-05 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "0002_unique_user_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                phone,
                created_at,
                ROW_NUMBER() OVER (
                    PARTITION BY phone
                    ORDER BY created_at DESC, id DESC
                ) AS rn,
                FIRST_VALUE(id) OVER (
                    PARTITION BY phone
                    ORDER BY created_at DESC, id DESC
                ) AS keep_id
            FROM users
        )
        UPDATE orders
        SET user_id = ranked.keep_id
        FROM ranked
        WHERE orders.user_id = ranked.id
          AND ranked.rn > 1;
        """
    )
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                phone,
                created_at,
                ROW_NUMBER() OVER (
                    PARTITION BY phone
                    ORDER BY created_at DESC, id DESC
                ) AS rn
            FROM users
        )
        DELETE FROM users
        USING ranked
        WHERE users.id = ranked.id
          AND ranked.rn > 1;
        """
    )
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                document,
                created_at,
                ROW_NUMBER() OVER (
                    PARTITION BY document
                    ORDER BY created_at DESC, id DESC
                ) AS rn,
                FIRST_VALUE(id) OVER (
                    PARTITION BY document
                    ORDER BY created_at DESC, id DESC
                ) AS keep_id
            FROM users
        )
        UPDATE orders
        SET user_id = ranked.keep_id
        FROM ranked
        WHERE orders.user_id = ranked.id
          AND ranked.rn > 1;
        """
    )
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                document,
                created_at,
                ROW_NUMBER() OVER (
                    PARTITION BY document
                    ORDER BY created_at DESC, id DESC
                ) AS rn
            FROM users
        )
        DELETE FROM users
        USING ranked
        WHERE users.id = ranked.id
          AND ranked.rn > 1;
        """
    )
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_index("ix_users_document", "users", ["document"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_document", table_name="users")
    op.drop_index("ix_users_phone", table_name="users")
