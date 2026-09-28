"""Add organization structure and effective access assignments."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0012_organization_access"
down_revision: str | None = "0011_control_resources"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "organization_units",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("kind", sa.String(40), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("parent_id", sa.String(36), nullable=True),
        sa.Column("manager_user_id", sa.String(36), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_id"], ["organization_units.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["manager_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "kind", "name", name="uq_org_unit_tenant_kind_name"),
    )
    op.create_index("ix_organization_units_tenant_id", "organization_units", ["tenant_id"])
    op.create_index("ix_organization_units_kind", "organization_units", ["kind"])
    op.create_index("ix_organization_units_parent_id", "organization_units", ["parent_id"])
    op.create_index("ix_organization_units_manager_user_id", "organization_units", ["manager_user_id"])
    op.create_table(
        "user_access_assignments",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("profile_id", sa.String(36), nullable=True),
        sa.Column("organization_unit_id", sa.String(36), nullable=True),
        sa.Column("job_title", sa.String(160), nullable=False),
        sa.Column("function_name", sa.String(160), nullable=False),
        sa.Column("scope", sa.JSON(), nullable=False),
        sa.Column("allow_permissions", sa.JSON(), nullable=False),
        sa.Column("deny_permissions", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["profile_id"], ["access_profiles.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_unit_id"], ["organization_units.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "user_id", name="uq_assignment_tenant_user"),
    )
    for column in ("tenant_id", "user_id", "profile_id", "organization_unit_id"):
        op.create_index(f"ix_user_access_assignments_{column}", "user_access_assignments", [column])


def downgrade() -> None:
    op.drop_table("user_access_assignments")
    op.drop_table("organization_units")
