import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from app.db.session import Base
from app.models.identity import Tenant
from app.models.saas import SaasProduct
from app.services.default_catalog import DEFAULT_PRODUCTS
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

MIGRATION = Path(__file__).resolve().parents[2] / "alembic/versions/0013_clear_seeded_saas_state.py"


def load_migration():
    spec = importlib.util.spec_from_file_location("clear_seeded_state", MIGRATION)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_default_catalog_seeds_identity_only():
    for product in DEFAULT_PRODUCTS:
        assert set(product) == {"name", "slug", "description", "color"}, product["slug"]


def test_migration_resets_only_untouched_seed_rows():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        tenant = Tenant(name="Central", slug="central")
        session.add(tenant)
        session.flush()
        old_seed = dict(
            version="1.8.0",
            base_url="https://mediamindai-backend.onrender.com",
            status="connected",
            health="degraded",
            compatibility="supported",
            integration_level="users_config",
            tenant_count=5,
            user_count=34,
            admin_api_version="1",
        )
        session.add_all(
            [
                SaasProduct(
                    tenant_id=tenant.id, name="MediaMind AI", slug="mediamind-ai", **old_seed
                ),
                SaasProduct(
                    tenant_id=tenant.id,
                    name="RH",
                    slug="rh",
                    version="2.0.7",
                    base_url="https://api.rh.app",
                    status="connected",
                    health="healthy",
                    tenant_count=6,
                    user_count=99,  # edited by a person: must be preserved
                ),
            ]
        )
        session.commit()

    with engine.begin() as connection:
        with Operations.context(MigrationContext.configure(connection)):
            load_migration().upgrade()

    with Session(engine) as session:
        rows = {p.slug: p for p in session.scalars(select(SaasProduct))}
    mediamind = rows["mediamind-ai"]
    assert (mediamind.status, mediamind.health, mediamind.version) == (
        "unavailable",
        "unknown",
        "1.0.0",
    )
    assert (mediamind.tenant_count, mediamind.user_count) == (0, 0)
    assert mediamind.admin_api_version is None
    assert mediamind.base_url == "https://mediamindai-backend.onrender.com"
    assert rows["rh"].health == "healthy"
    assert rows["rh"].user_count == 99
