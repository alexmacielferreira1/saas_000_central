"""Record the authenticated requester of administrative operations."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0013_operation_requester"
down_revision: str | None = "0012_organization_access"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "admin_operations",
        sa.Column("requested_by_user_id", sa.String(36), nullable=True),
    )
    op.create_foreign_key(
        "fk_admin_operations_requested_by_user_id",
        "admin_operations",
        "users",
        ["requested_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_admin_operations_requested_by_user_id",
        "admin_operations",
        ["requested_by_user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_admin_operations_requested_by_user_id", table_name="admin_operations")
    op.drop_constraint(
        "fk_admin_operations_requested_by_user_id", "admin_operations", type_="foreignkey"
    )
    op.drop_column("admin_operations", "requested_by_user_id")
