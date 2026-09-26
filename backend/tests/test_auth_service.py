from datetime import UTC, datetime, timedelta

import pytest
from app.db.session import Base
from app.models.identity import AuthSession, Membership, Tenant, User
from app.security.passwords import hash_password
from app.security.sessions import hash_session_token
from app.services.auth import AccountNotAllowed, authenticate, create_session_for_user
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture
def db_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as session:
        yield session
    engine.dispose()


def seed_user(db_session, *, active=True, membership=True):
    user = User(
        email="alex@example.com",
        email_normalized="alex@example.com",
        password_hash=hash_password("secret-value"),
        full_name="Alex",
        is_active=active,
    )
    tenant = Tenant(name="Central", slug="central")
    db_session.add_all([user, tenant])
    db_session.flush()
    if membership:
        db_session.add(Membership(user_id=user.id, tenant_id=tenant.id, role="superadmin"))
    db_session.commit()
    return user


def test_authenticate_normalizes_email_and_creates_hashed_session(db_session):
    seeded = seed_user(db_session)
    result = authenticate(db_session, "  ALEX@EXAMPLE.COM ", "secret-value", session_hours=8)
    assert result.user.id == seeded.id
    assert result.token != result.auth_session.token_hash
    assert hash_session_token(result.token) == result.auth_session.token_hash


def test_user_without_active_membership_gets_no_session(db_session):
    user = seed_user(db_session, membership=False)
    with pytest.raises(AccountNotAllowed):
        create_session_for_user(db_session, user, session_hours=8)
    assert db_session.query(AuthSession).count() == 0


@pytest.mark.parametrize(
    "email,password", [("missing@example.com", "secret-value"), ("alex@example.com", "wrong")]
)
def test_wrong_or_unknown_credentials_return_same_result(db_session, email, password):
    seed_user(db_session)
    assert authenticate(db_session, email, password, session_hours=8) is None


def test_inactive_user_cannot_authenticate(db_session):
    seed_user(db_session, active=False)
    assert authenticate(db_session, "alex@example.com", "secret-value", session_hours=8) is None


def test_failed_attempts_lock_account(db_session):
    user = seed_user(db_session)
    now = datetime.now(UTC)
    authenticate(
        db_session,
        user.email,
        "wrong",
        session_hours=8,
        max_attempts=2,
        lockout_minutes=15,
        now=now,
    )
    authenticate(
        db_session,
        user.email,
        "wrong",
        session_hours=8,
        max_attempts=2,
        lockout_minutes=15,
        now=now,
    )
    assert user.locked_until == now + timedelta(minutes=15)
    assert authenticate(db_session, user.email, "secret-value", session_hours=8, now=now) is None
