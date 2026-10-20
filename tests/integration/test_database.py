import os
from pathlib import Path

import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory
from app.db.session import engine
from sqlalchemy import text

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("HUB_INTEGRATION") != "1",
        reason="Set HUB_INTEGRATION=1 for local PostgreSQL",
    ),
]


def alembic_head() -> str:
    root = Path(__file__).resolve().parents[2]
    config = Config(str(root / "alembic.ini"))
    config.set_main_option("script_location", str(root / "alembic"))
    return ScriptDirectory.from_config(config).get_current_head()


def test_database_and_migration_revision():
    with engine.connect() as connection:
        assert connection.scalar(text("select 1")) == 1
        assert connection.scalar(text("select version_num from alembic_version")) == (
            alembic_head()
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
