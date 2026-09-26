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
def registry_client():
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
        yield client, factory
    engine.dispose()


def login(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "alex@example.com", "password": PASSWORD},
    )
    assert response.status_code == 200


def product_payload(**overrides):
    payload = {
        "name": "MediaMind AI",
        "slug": "mediamind-ai",
        "description": "Gestão audiovisual e produção de conteúdo.",
        "version": "1.0.0",
        "base_url": "https://mediamindai-frontend.onrender.com",
        "color": "#06b6d4",
        "icon": "Clapperboard",
        "status": "active",
        "health": "healthy",
        "compatibility": "native",
        "integration_level": "domain_resources",
    }
    payload.update(overrides)
    return payload


def test_registry_requires_authenticated_session(registry_client):
    client, _ = registry_client
    assert client.get("/api/v1/saas").status_code == 401


def test_superadmin_can_register_and_list_saas_for_selected_tenant(registry_client):
    client, _ = registry_client
    login(client)

    created = client.post("/api/v1/saas", json=product_payload())

    assert created.status_code == 201
    assert created.json()["slug"] == "mediamind-ai"
    listed = client.get("/api/v1/saas")
    assert listed.status_code == 200
    assert [item["name"] for item in listed.json()] == ["MediaMind AI"]


def test_registry_rejects_duplicate_slug_in_same_tenant(registry_client):
    client, _ = registry_client
    login(client)
    assert client.post("/api/v1/saas", json=product_payload()).status_code == 201

    duplicate = client.post("/api/v1/saas", json=product_payload(name="Outro produto"))

    assert duplicate.status_code == 409
    assert duplicate.json()["error_code"] == "SAAS_SLUG_EXISTS"


def test_registry_returns_one_product_from_selected_tenant(registry_client):
    client, _ = registry_client
    login(client)
    created = client.post("/api/v1/saas", json=product_payload()).json()

    response = client.get(f"/api/v1/saas/{created['id']}")

    assert response.status_code == 200
    assert response.json()["name"] == "MediaMind AI"


def test_registry_does_not_expose_products_from_another_tenant(registry_client):
    client, factory = registry_client
    login(client)
    assert client.post("/api/v1/saas", json=product_payload()).status_code == 201

    from app.models.saas import SaasProduct

    with factory() as session:
        other = Tenant(name="Outro cliente", slug="outro")
        session.add(other)
        session.flush()
        session.add(
            SaasProduct(
                tenant_id=other.id,
                name="Produto oculto",
                slug="produto-oculto",
            )
        )
        session.commit()

    listed = client.get("/api/v1/saas")
    assert [item["slug"] for item in listed.json()] == ["mediamind-ai"]
