import pytest
from app.db.session import Base, get_session
from app.main import create_app
from app.models.identity import Membership, Tenant, User
from app.security.passwords import hash_password
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
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

    audit = client.get("/api/v1/audit")
    assert audit.status_code == 200
    assert audit.json()[0]["action"] == "saas.create"
    assert audit.json()[0]["resource_id"] == created.json()["id"]
    assert audit.json()[0]["actor_email"] == "alex@example.com"
    assert audit.json()[0]["after_data"]["slug"] == "mediamind-ai"


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


def test_superadmin_can_update_saas_and_change_is_persisted(registry_client):
    client, _ = registry_client
    login(client)
    created = client.post("/api/v1/saas", json=product_payload()).json()

    response = client.patch(
        f"/api/v1/saas/{created['id']}",
        json={"name": "MediaMind Control", "version": "2.0.0", "health": "degraded"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "MediaMind Control"
    assert response.json()["version"] == "2.0.0"
    assert response.json()["health"] == "degraded"
    persisted = client.get(f"/api/v1/saas/{created['id']}")
    assert persisted.json()["name"] == "MediaMind Control"

    audit = client.get("/api/v1/audit").json()[0]
    assert audit["action"] == "saas.update"
    assert audit["before_data"]["name"] == "MediaMind AI"
    assert audit["after_data"]["name"] == "MediaMind Control"
    assert audit["correlation_id"] == response.headers["X-Correlation-ID"]


def test_registry_update_rejects_duplicate_slug(registry_client):
    client, _ = registry_client
    login(client)
    client.post("/api/v1/saas", json=product_payload())
    second = client.post(
        "/api/v1/saas",
        json=product_payload(name="Outro produto", slug="outro-produto"),
    ).json()

    response = client.patch(f"/api/v1/saas/{second['id']}", json={"slug": "mediamind-ai"})

    assert response.status_code == 409
    assert response.json()["error_code"] == "SAAS_SLUG_EXISTS"


def test_registry_update_rejects_null_for_persisted_fields(registry_client):
    client, _ = registry_client
    login(client)
    created = client.post("/api/v1/saas", json=product_payload()).json()

    response = client.patch(f"/api/v1/saas/{created['id']}", json={"name": None})

    assert response.status_code == 422


def test_viewer_cannot_update_saas(registry_client):
    client, factory = registry_client
    login(client)
    created = client.post("/api/v1/saas", json=product_payload()).json()

    with factory() as session:
        membership = session.scalar(select(Membership))
        membership.role = "viewer"
        session.commit()

    response = client.patch(f"/api/v1/saas/{created['id']}", json={"name": "Negado"})

    assert response.status_code == 403
    assert response.json()["error_code"] == "SAAS_WRITE_FORBIDDEN"


def test_viewer_cannot_read_audit_log(registry_client):
    client, factory = registry_client
    login(client)

    with factory() as session:
        membership = session.scalar(select(Membership))
        membership.role = "viewer"
        session.commit()

    response = client.get("/api/v1/audit")

    assert response.status_code == 403
    assert response.json()["error_code"] == "AUDIT_READ_FORBIDDEN"


def test_superadmin_can_publish_and_read_capability_manifest(registry_client):
    client, _ = registry_client
    login(client)
    product = client.post("/api/v1/saas", json=product_payload()).json()
    payload = {
        "version": "1.2.0",
        "admin_api_version": "v1",
        "compatibility": "native",
        "capabilities": ["users.read", "configuration.write"],
        "health": {"endpoint": "/health", "interval_seconds": 60},
        "resources": [{"name": "users", "operations": ["list", "update"]}],
        "scopes": ["central:read", "central:write"],
        "events": ["user.updated"],
        "limits": {"requests_per_minute": 120},
    }

    published = client.put(f"/api/v1/manifests/{product['id']}", json=payload)

    assert published.status_code == 200
    assert published.json()["saas_product_id"] == product["id"]
    assert published.json()["capabilities"] == payload["capabilities"]
    assert client.get(f"/api/v1/manifests/{product['id']}").json()["version"] == "1.2.0"
    listed = client.get("/api/v1/manifests")
    assert listed.status_code == 200
    assert [item["saas_product_id"] for item in listed.json()] == [product["id"]]

    audit = client.get("/api/v1/audit").json()[0]
    assert audit["action"] == "manifest.upsert"
    assert audit["resource_id"] == published.json()["id"]
    assert audit["correlation_id"] == published.headers["X-Correlation-ID"]


def test_manifest_update_persists_one_current_record(registry_client):
    client, _ = registry_client
    login(client)
    product = client.post("/api/v1/saas", json=product_payload()).json()
    first = client.put(
        f"/api/v1/manifests/{product['id']}",
        json={"version": "1.0.0", "capabilities": ["users.read"]},
    ).json()

    updated = client.put(
        f"/api/v1/manifests/{product['id']}",
        json={"version": "1.1.0", "capabilities": ["users.read", "users.write"]},
    )

    assert updated.status_code == 200
    assert updated.json()["id"] == first["id"]
    assert updated.json()["version"] == "1.1.0"
    assert len(client.get("/api/v1/manifests").json()) == 1


def test_viewer_cannot_publish_capability_manifest(registry_client):
    client, factory = registry_client
    login(client)
    product = client.post("/api/v1/saas", json=product_payload()).json()
    with factory() as session:
        membership = session.scalar(select(Membership))
        membership.role = "viewer"
        session.commit()

    response = client.put(
        f"/api/v1/manifests/{product['id']}",
        json={"version": "1.0.0", "capabilities": []},
    )

    assert response.status_code == 403
    assert response.json()["error_code"] == "MANIFEST_WRITE_FORBIDDEN"


def test_home_summary_uses_only_selected_tenant_data(registry_client):
    client, factory = registry_client
    login(client)
    assert client.post("/api/v1/saas", json=product_payload(status="connected")).status_code == 201
    assert (
        client.post(
            "/api/v1/saas",
            json=product_payload(
                name="Produto degradado",
                slug="produto-degradado",
                status="connected",
                health="degraded",
            ),
        ).status_code
        == 201
    )

    from app.models.saas import SaasProduct

    with factory() as session:
        other = Tenant(name="Outro cliente", slug="outro-resumo")
        session.add(other)
        session.flush()
        session.add(
            SaasProduct(
                tenant_id=other.id,
                name="Produto de outro tenant",
                slug="produto-outro-tenant",
                status="connected",
                health="down",
            )
        )
        session.commit()

    response = client.get("/api/v1/home/summary")

    assert response.status_code == 200
    assert response.json()["products"] == {"total": 2, "connected": 2, "degraded": 1}
    assert response.json()["operations"] == {"availability": "unavailable", "active": None}
    assert response.json()["incidents"] == {"availability": "unavailable", "open": None}


def test_home_summary_denies_inactive_membership(registry_client):
    client, factory = registry_client
    login(client)
    with factory() as session:
        membership = session.scalar(select(Membership))
        membership.is_active = False
        session.commit()

    response = client.get("/api/v1/home/summary")

    assert response.status_code == 403
    assert response.json()["error_code"] == "TENANT_ACCESS_FORBIDDEN"
