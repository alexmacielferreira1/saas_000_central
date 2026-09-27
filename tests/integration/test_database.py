import os

import pytest
from app.db.session import engine
from sqlalchemy import text

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("HUB_INTEGRATION") != "1",
        reason="Set HUB_INTEGRATION=1 for local PostgreSQL",
    ),
]


def test_database_and_migration_revision():
    with engine.connect() as connection:
        assert connection.scalar(text("select 1")) == 1
        assert (
            connection.scalar(text("select version_num from alembic_version"))
            == "0010_integration_observations"
        )
        tables = set(
            connection.scalars(text("select tablename from pg_tables where schemaname = 'public'"))
        )
        assert {
            "users",
            "tenants",
            "memberships",
            "auth_sessions",
            "saas_products",
            "audit_logs",
            "capability_manifests",
            "product_users",
            "configurations",
            "permission_definitions",
            "access_profiles",
            "admin_operations",
            "saas_connections",
            "saas_environments",
            "integration_observations",
        } <= tables
