"""Add tenant-scoped capability manifests."""

import sqlalchemy as sa

from alembic import op

revision = "0005_capability_manifests"
down_revision = "0004_audit_logs"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "capability_manifests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "tenant_id",
            sa.String(36),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "saas_product_id",
            sa.String(36),
            sa.ForeignKey("saas_products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("version", sa.String(50), nullable=False, server_default="1.0.0"),
        sa.Column("admin_api_version", sa.String(50)),
        sa.Column("compatibility", sa.String(50), nullable=False, server_default="limited"),
        sa.Column("capabilities", sa.JSON(), nullable=False),
        sa.Column("health", sa.JSON(), nullable=False),
        sa.Column("resources", sa.JSON(), nullable=False),
        sa.Column("scopes", sa.JSON(), nullable=False),
        sa.Column("events", sa.JSON(), nullable=False),
        sa.Column("limits", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("tenant_id", "saas_product_id", name="uq_manifest_tenant_product"),
    )
    op.create_index("ix_capability_manifests_tenant_id", "capability_manifests", ["tenant_id"])
    op.create_index(
        "ix_capability_manifests_saas_product_id",
        "capability_manifests",
        ["saas_product_id"],
    )


def downgrade():
    op.drop_table("capability_manifests")
