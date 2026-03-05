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
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_index("ix_users_document", "users", ["document"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_document", table_name="users")
    op.drop_index("ix_users_phone", table_name="users")
