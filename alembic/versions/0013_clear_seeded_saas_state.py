"""Clear invented operational state seeded into the default SaaS catalog.

Earlier bootstraps seeded status, health, versions, counts and URLs that were never
observed. Only rows that still match the seed exactly and were never probed
(``last_handshake IS NULL``) are reset, so anything a person edited or a real probe
confirmed is preserved. The invented values cannot be restored on downgrade.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0013_clear_seeded_saas_state"
down_revision: str | None = "0012_organization_access"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Exact values written by the old seed; a row is reset only when all of them still match.
SEEDED_STATE = {
    "lojafacil360": {
        "version": "2.4.1",
        "base_url": "https://api.lojafacil360.app",
        "status": "connected",
        "health": "healthy",
        "tenant_count": 12,
        "user_count": 87,
    },
    "mediamind-ai": {
        "version": "1.8.0",
        "status": "connected",
        "health": "degraded",
        "tenant_count": 5,
        "user_count": 34,
    },
    "medicina": {
        "version": "3.1.2",
        "base_url": "https://api.medicina.app",
        "status": "limited",
        "health": "healthy",
        "tenant_count": 8,
        "user_count": 56,
    },
    "rh": {
        "version": "2.0.7",
        "base_url": "https://api.rh.app",
        "status": "connected",
        "health": "healthy",
        "tenant_count": 6,
        "user_count": 42,
    },
    "rh2": {"version": "1.2.0", "compatibility": "incompatible", "admin_api_version": "0"},
}

RESET = {
    "version": "1.0.0",
    "status": "unavailable",
    "health": "unknown",
    "compatibility": "limited",
    "integration_level": "inventory",
    "admin_api_version": None,
    "tenant_count": 0,
    "user_count": 0,
}

products = sa.table(
    "saas_products",
    sa.column("slug", sa.String),
    sa.column("version", sa.String),
    sa.column("base_url", sa.String),
    sa.column("status", sa.String),
    sa.column("health", sa.String),
    sa.column("compatibility", sa.String),
    sa.column("integration_level", sa.String),
    sa.column("admin_api_version", sa.String),
    sa.column("tenant_count", sa.Integer),
    sa.column("user_count", sa.Integer),
    sa.column("last_handshake", sa.DateTime(timezone=True)),
)


def upgrade() -> None:
    for slug, seeded in SEEDED_STATE.items():
        conditions = [products.c.slug == slug, products.c.last_handshake.is_(None)]
        conditions += [products.c[column] == value for column, value in seeded.items()]
        values = dict(RESET)
        if "base_url" in seeded:
            values["base_url"] = ""
        op.execute(products.update().where(*conditions).values(**values))


def downgrade() -> None:
    """Invented values are intentionally not restored."""
