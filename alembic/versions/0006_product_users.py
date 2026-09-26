"""Add tenant-scoped product user projections."""

import sqlalchemy as sa

from alembic import op

revision = "0006_product_users"
down_revision = "0005_capability_manifests"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "product_users",
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
        sa.Column("external_id", sa.String(200)),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("email_normalized", sa.String(320), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=False, server_default=""),
        sa.Column("role", sa.String(100), nullable=False, server_default=""),
        sa.Column("product_tenant", sa.String(200), nullable=False, server_default=""),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("source", sa.String(50), nullable=False, server_default="central_manual"),
        sa.Column("last_sync", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint(
            "tenant_id",
            "saas_product_id",
            "email_normalized",
            name="uq_product_user_tenant_product_email",
        ),
    )
    op.create_index("ix_product_users_tenant_id", "product_users", ["tenant_id"])
    op.create_index("ix_product_users_saas_product_id", "product_users", ["saas_product_id"])


def downgrade():
    op.drop_table("product_users")
