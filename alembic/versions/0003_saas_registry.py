"""Add tenant-scoped SaaS product registry."""

import sqlalchemy as sa

from alembic import op

revision = "0003_saas_registry"
down_revision = "0002_identity_auth"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "saas_products",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "tenant_id",
            sa.String(36),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("version", sa.String(50), nullable=False, server_default="1.0.0"),
        sa.Column("base_url", sa.String(500), nullable=False, server_default=""),
        sa.Column("color", sa.String(20), nullable=False, server_default="#6366f1"),
        sa.Column("icon", sa.String(100), nullable=False, server_default="Boxes"),
        sa.Column("status", sa.String(50), nullable=False, server_default="unavailable"),
        sa.Column("health", sa.String(50), nullable=False, server_default="unknown"),
        sa.Column("compatibility", sa.String(50), nullable=False, server_default="limited"),
        sa.Column("integration_level", sa.String(50), nullable=False, server_default="inventory"),
        sa.Column("admin_api_version", sa.String(50)),
        sa.Column("last_handshake", sa.DateTime(timezone=True)),
        sa.Column("tenant_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("user_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("tenant_id", "slug", name="uq_saas_tenant_slug"),
    )
    op.create_index("ix_saas_products_tenant_id", "saas_products", ["tenant_id"])


def downgrade():
    op.drop_table("saas_products")
