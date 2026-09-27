"""Add native administrative operations."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0009_admin_operations"
down_revision: str | None = "0008_access_profiles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "admin_operations",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("saas", sa.String(200), nullable=False),
        sa.Column("product_tenant", sa.String(200), nullable=False),
        sa.Column("resource", sa.String(300), nullable=False),
        sa.Column("action", sa.String(200), nullable=False),
        sa.Column("requested_by", sa.String(320), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("dry_run", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("retry_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_operations_tenant_id", "admin_operations", ["tenant_id"])
    op.create_index("ix_admin_operations_saas", "admin_operations", ["saas"])


def downgrade() -> None:
    op.drop_index("ix_admin_operations_saas", table_name="admin_operations")
    op.drop_index("ix_admin_operations_tenant_id", table_name="admin_operations")
    op.drop_table("admin_operations")
