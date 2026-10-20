"""Persist remote command identity and result for administrative operations."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0013_operation_remote_result"
down_revision: str | None = "0012_organization_access"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("admin_operations", sa.Column("remote_operation_id", sa.String(200)))
    op.add_column(
        "admin_operations",
        sa.Column("result", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
    )
    op.add_column("admin_operations", sa.Column("failure_code", sa.String(100)))
    op.create_index(
        "ix_admin_operations_remote_operation_id",
        "admin_operations",
        ["remote_operation_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_admin_operations_remote_operation_id", table_name="admin_operations")
    op.drop_column("admin_operations", "failure_code")
    op.drop_column("admin_operations", "result")
    op.drop_column("admin_operations", "remote_operation_id")
