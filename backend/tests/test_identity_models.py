import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.models.identity import Membership, Tenant, User


@pytest.fixture
def session():
    engine = create_engine("sqlite+pysqlite:///:memory:", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as value:
        yield value
    Base.metadata.drop_all(engine)
    engine.dispose()


def test_user_email_is_unique(session):
    session.add(User(email="Alex@Example.com", email_normalized="alex@example.com", password_hash="hash", full_name="Alex"))
    session.commit()
    session.add(User(email="alex@example.com", email_normalized="alex@example.com", password_hash="other", full_name="Other"))
    with pytest.raises(IntegrityError):
        session.commit()


def test_membership_is_unique_per_user_and_tenant(session):
    user = User(email="alex@example.com", email_normalized="alex@example.com", password_hash="hash", full_name="Alex")
    tenant = Tenant(name="Central", slug="central")
    session.add_all([user, tenant])
    session.flush()
    session.add(Membership(user_id=user.id, tenant_id=tenant.id, role="superadmin"))
    session.commit()
    session.add(Membership(user_id=user.id, tenant_id=tenant.id, role="viewer"))
    with pytest.raises(IntegrityError):
        session.commit()
