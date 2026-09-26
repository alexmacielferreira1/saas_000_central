from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_session
from app.main import create_app
from app.models.identity import Membership, Tenant, User
from app.security.passwords import hash_password

PASSWORD = "senha-segura"


@pytest.fixture
def auth_client():
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine); factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as session:
        user = User(email="alexmacielferreira@gmail.com", email_normalized="alexmacielferreira@gmail.com", password_hash=hash_password(PASSWORD), full_name="Alex Maciel Ferreira")
        tenant = Tenant(name="Central SaaS", slug="central")
        session.add_all([user, tenant]); session.flush(); session.add(Membership(user_id=user.id, tenant_id=tenant.id, role="superadmin")); session.commit()
    def override():
        with factory() as session: yield session
    app = create_app(); app.dependency_overrides[get_session] = override
    with TestClient(app, raise_server_exceptions=False) as client: yield client
    engine.dispose()


def test_login_sets_http_only_cookie_and_restores_session(auth_client):
    response = auth_client.post("/api/v1/auth/login", json={"email": "  AlexMacielFerreira@GMAIL.COM ", "password": PASSWORD})
    assert response.status_code == 200
    assert response.json()["memberships"][0]["role"] == "superadmin"
    assert "central_session=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]
    assert auth_client.get("/api/v1/auth/session").status_code == 200


def test_invalid_login_has_uniform_public_error(auth_client):
    response = auth_client.post("/api/v1/auth/login", json={"email": "missing@example.com", "password": PASSWORD})
    assert response.status_code == 401
    assert response.json()["error_code"] == "INVALID_CREDENTIALS"


def test_logout_revokes_session(auth_client):
    auth_client.post("/api/v1/auth/login", json={"email": "alexmacielferreira@gmail.com", "password": PASSWORD})
    assert auth_client.post("/api/v1/auth/logout").status_code == 204
    assert auth_client.get("/api/v1/auth/session").status_code == 401
