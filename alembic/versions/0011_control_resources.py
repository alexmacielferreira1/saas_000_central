"""Add tenant-scoped administrative control resources."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0011_control_resources"
down_revision: str | None = "0010_integration_observations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "control_resources",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("kind", sa.String(80), nullable=False),
        sa.Column("key", sa.String(160), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "kind", "key", name="uq_control_resource_tenant_kind_key"),
    )
    op.create_index("ix_control_resources_tenant_id", "control_resources", ["tenant_id"])
    op.create_index("ix_control_resources_kind", "control_resources", ["kind"])
    op.create_index("ix_control_resources_status", "control_resources", ["status"])


def downgrade() -> None:
    op.drop_index("ix_control_resources_status", table_name="control_resources")
    op.drop_index("ix_control_resources_kind", table_name="control_resources")
    op.drop_index("ix_control_resources_tenant_id", table_name="control_resources")
    op.drop_table("control_resources")
