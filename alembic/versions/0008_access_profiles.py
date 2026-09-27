"""Add access profiles and permission catalog."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008_access_profiles"
down_revision: str | None = "0007_configurations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "permission_definitions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("code", sa.String(160), nullable=False),
        sa.Column("resource", sa.String(100), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("scope", sa.String(50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "code", name="uq_permission_tenant_code"),
    )
    op.create_index("ix_permission_definitions_tenant_id", "permission_definitions", ["tenant_id"])
    op.create_table(
        "access_profiles",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("permissions", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "name", name="uq_profile_tenant_name"),
    )
    op.create_index("ix_access_profiles_tenant_id", "access_profiles", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_access_profiles_tenant_id", table_name="access_profiles")
    op.drop_table("access_profiles")
    op.drop_index("ix_permission_definitions_tenant_id", table_name="permission_definitions")
    op.drop_table("permission_definitions")
