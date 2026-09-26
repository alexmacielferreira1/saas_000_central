from types import SimpleNamespace

from app.db.session import Base
from app.models.identity import Membership, User
from app.models.saas import SaasProduct
from app.services.bootstrap import bootstrap_initial_admin
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


def test_bootstrap_creates_superadmin_once_without_resetting_it():
    engine = create_engine("sqlite+pysqlite:///:memory:", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    settings = SimpleNamespace(
        bootstrap_admin_email="alexmacielferreira@gmail.com",
        bootstrap_admin_password=SimpleNamespace(get_secret_value=lambda: "senha-segura"),
        bootstrap_admin_name="Alex Maciel Ferreira",
        bootstrap_tenant_name="Central SaaS",
        bootstrap_tenant_slug="central",
    )
    with factory() as session:
        first = bootstrap_initial_admin(session, settings)
        original_hash = session.scalar(select(User.password_hash))
        second = bootstrap_initial_admin(session, settings)
        assert first.status == "created"
        assert second.status == "already_configured"
        assert session.scalar(select(User.password_hash)) == original_hash
        assert session.scalar(select(Membership.role)) == "superadmin"
        products = list(session.scalars(select(SaasProduct).order_by(SaasProduct.name)))
        assert len(products) == 11
        assert {product.slug for product in products} >= {"clinicafit", "mediamind-ai"}
    engine.dispose()
