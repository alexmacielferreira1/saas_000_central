# ruff: noqa: F811
from datetime import UTC, datetime, timedelta

import pytest
from app.db.session import Base
from app.models.identity import Membership, Tenant, User
from app.security.passwords import hash_password
from app.services.auth import ACCOUNT_LOCK_FACTOR, authenticate
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.tests.test_auth_api import auth_client  # noqa: F401

PASSWORD = "secret-value"
ATTACKER = "203.0.113.10"
OWNER = "198.51.100.7"


@pytest.fixture
def factory():
    engine = create_engine("sqlite+pysqlite:///:memory:", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    make = sessionmaker(bind=engine, expire_on_commit=False)
    with make() as session:
        user = User(
            email="alex@example.com",
            email_normalized="alex@example.com",
            password_hash=hash_password(PASSWORD),
            full_name="Alex",
        )
        tenant = Tenant(name="Central", slug="central")
        session.add_all([user, tenant])
        session.flush()
        session.add(Membership(user_id=user.id, tenant_id=tenant.id, role="superadmin"))
        session.commit()
    yield make
    engine.dispose()


def attempt(factory, password, ip, now, max_attempts=5):
    with factory() as session:
        return authenticate(
            session,
            "alex@example.com",
            password,
            session_hours=8,
            max_attempts=max_attempts,
            lockout_minutes=15,
            now=now,
            client_ip=ip,
        )


def failures(factory) -> int:
    with factory() as session:
        return session.query(User).one().failed_login_attempts


def test_failed_attempt_counter_is_incremented_atomically(factory):
    now = datetime.now(UTC)
    with factory() as stale:
        stale.query(User).one()  # carrega a linha no identity map com 0 falhas
        with factory() as other:
            other.query(User).one().failed_login_attempts = 3
            other.commit()
        authenticate(
            stale,
            "alex@example.com",
            "wrong",
            session_hours=8,
            now=now,
            client_ip=ATTACKER,
        )
    assert failures(factory) == 4


def test_attacker_cannot_lock_owner_out_from_another_address(factory):
    now = datetime.now(UTC)
    for _ in range(12):
        assert attempt(factory, "wrong", ATTACKER, now) is None

    assert attempt(factory, PASSWORD, OWNER, now) is not None


def test_same_account_and_address_is_throttled_until_lock_expires(factory):
    now = datetime.now(UTC)
    for _ in range(5):
        attempt(factory, "wrong", ATTACKER, now)

    assert attempt(factory, PASSWORD, ATTACKER, now) is None
    assert attempt(factory, PASSWORD, ATTACKER, now + timedelta(minutes=16)) is not None


def test_repeated_lockouts_back_off_exponentially(factory):
    now = datetime.now(UTC)
    for _ in range(5):
        attempt(factory, "wrong", ATTACKER, now)
    later = now + timedelta(minutes=16)
    for _ in range(5):
        attempt(factory, "wrong", ATTACKER, later)

    assert attempt(factory, PASSWORD, ATTACKER, later + timedelta(minutes=29)) is None
    assert attempt(factory, PASSWORD, ATTACKER, later + timedelta(minutes=31)) is not None


def test_distributed_attack_hits_account_ceiling_and_counter_restarts(factory):
    now = datetime.now(UTC)
    for index in range(5 * ACCOUNT_LOCK_FACTOR):
        attempt(factory, "wrong", f"203.0.113.{index}", now)

    assert attempt(factory, PASSWORD, OWNER, now) is None
    assert failures(factory) == 0
    assert attempt(factory, PASSWORD, OWNER, now + timedelta(minutes=16)) is not None


def test_login_route_passes_client_address_to_throttle(auth_client, monkeypatch):
    seen = {}

    def fake_authenticate(*args, **kwargs):
        seen.update(kwargs)
        return None

    monkeypatch.setattr("app.api.v1.auth.authenticate", fake_authenticate)

    response = auth_client.post(
        "/api/v1/auth/login", json={"email": "alex@example.com", "password": "wrong"}
    )

    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_CREDENTIALS"
    assert seen["client_ip"] == "testclient"
