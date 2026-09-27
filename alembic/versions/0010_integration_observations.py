"""Persist SaaS connections, environments and observations."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0010_integration_observations"
down_revision: str | None = "0009_admin_operations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "saas_connections",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("saas_product_id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("credential_ref", sa.String(200), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["saas_product_id"], ["saas_products.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tenant_id",
            "saas_product_id",
            name="uq_saas_connection_tenant_product",
        ),
    )
    op.create_index("ix_saas_connections_tenant_id", "saas_connections", ["tenant_id"])
    op.create_index(
        "ix_saas_connections_saas_product_id", "saas_connections", ["saas_product_id"]
    )
    op.create_table(
        "saas_environments",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("connection_id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("base_url", sa.String(500), nullable=False),
        sa.Column("freshness_ttl_seconds", sa.Integer(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["connection_id"], ["saas_connections.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tenant_id",
            "connection_id",
            "name",
            name="uq_saas_environment_connection_name",
        ),
    )
    op.create_index("ix_saas_environments_tenant_id", "saas_environments", ["tenant_id"])
    op.create_index(
        "ix_saas_environments_connection_id", "saas_environments", ["connection_id"]
    )
    op.create_table(
        "integration_observations",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("tenant_id", sa.String(36), nullable=False),
        sa.Column("connection_id", sa.String(36), nullable=False),
        sa.Column("environment_id", sa.String(36), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("source", sa.String(120), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("failure_code", sa.String(100), nullable=True),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["connection_id"], ["saas_connections.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["environment_id"], ["saas_environments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_integration_observations_tenant_id", "integration_observations", ["tenant_id"]
    )
    op.create_index(
        "ix_integration_observations_connection_id",
        "integration_observations",
        ["connection_id"],
    )
    op.create_index(
        "ix_integration_observations_environment_id",
        "integration_observations",
        ["environment_id"],
    )
    op.create_index(
        "ix_integration_observations_status", "integration_observations", ["status"]
    )


def downgrade() -> None:
    op.drop_index("ix_integration_observations_status", table_name="integration_observations")
    op.drop_index(
        "ix_integration_observations_environment_id", table_name="integration_observations"
    )
    op.drop_index(
        "ix_integration_observations_connection_id", table_name="integration_observations"
    )
    op.drop_index("ix_integration_observations_tenant_id", table_name="integration_observations")
    op.drop_table("integration_observations")
    op.drop_index("ix_saas_environments_connection_id", table_name="saas_environments")
    op.drop_index("ix_saas_environments_tenant_id", table_name="saas_environments")
    op.drop_table("saas_environments")
    op.drop_index("ix_saas_connections_saas_product_id", table_name="saas_connections")
    op.drop_index("ix_saas_connections_tenant_id", table_name="saas_connections")
    op.drop_table("saas_connections")
