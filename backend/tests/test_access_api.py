import pytest
from app.db.session import Base, get_session
from app.main import create_app
from app.models.identity import Membership, Tenant, User
from app.security.passwords import hash_password
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

PASSWORD = "senha-segura"


@pytest.fixture
def access_client():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as session:
        user = User(
            email="alex@example.com",
            email_normalized="alex@example.com",
            password_hash=hash_password(PASSWORD),
            full_name="Alex",
        )
        tenant = Tenant(name="Central SaaS", slug="central")
        session.add_all([user, tenant])
        session.flush()
        session.add(Membership(user_id=user.id, tenant_id=tenant.id, role="superadmin"))
        session.commit()

    def override():
        with factory() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_session] = override
    with TestClient(app, raise_server_exceptions=False) as client:
        client.post(
            "/api/v1/auth/login",
            json={"email": "alex@example.com", "password": PASSWORD},
        )
        yield client
    engine.dispose()


def test_lists_real_administrators_for_selected_tenant(access_client):
    response = access_client.get("/api/v1/access/managers")

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": response.json()[0]["id"],
            "full_name": "Alex",
            "email": "alex@example.com",
            "role": "superadmin",
            "scope_saas": "*",
            "status": "active",
            "two_factor_enabled": False,
        }
    ]


def test_superadmin_creates_administrator_with_login(access_client):
    response = access_client.post(
        "/api/v1/access/managers",
        json={
            "full_name": "Gestora Central",
            "email": "gestora@example.com",
            "role": "viewer",
            "password": "Senha-temporaria-2026!",
        },
    )

    assert response.status_code == 201
    assert response.json()["email"] == "gestora@example.com"
    listed = access_client.get("/api/v1/access/managers").json()
    assert [item["email"] for item in listed] == ["alex@example.com", "gestora@example.com"]
