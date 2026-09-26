"""Add tenant-scoped configurations."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0007_configurations"
down_revision: str | None = "0006_product_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "configurations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("saas_product_id", sa.String(length=36), nullable=True),
        sa.Column("scope_key", sa.String(length=36), nullable=False),
        sa.Column("key", sa.String(length=200), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("previous_value", sa.Text(), nullable=True),
        sa.Column("environment", sa.String(length=50), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("author", sa.String(length=320), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("approval_status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["saas_product_id"], ["saas_products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tenant_id", "scope_key", "environment", "key", name="uq_configuration_scope_key"
        ),
    )
    op.create_index("ix_configurations_tenant_id", "configurations", ["tenant_id"])
    op.create_index("ix_configurations_saas_product_id", "configurations", ["saas_product_id"])


def downgrade() -> None:
    op.drop_index("ix_configurations_saas_product_id", table_name="configurations")
    op.drop_index("ix_configurations_tenant_id", table_name="configurations")
    op.drop_table("configurations")
