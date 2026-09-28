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


def test_superadmin_creates_permission_and_versioned_profile(access_client):
    permission = access_client.post(
        "/api/v1/access/permissions",
        json={
            "code": "saas.read",
            "resource": "saas",
            "action": "read",
            "scope": "tenant",
            "description": "Visualizar produtos do tenant",
        },
    )
    assert permission.status_code == 201

    profile = access_client.post(
        "/api/v1/access/profiles",
        json={
            "name": "Gestor de produto",
            "description": "Acesso de leitura ao catálogo",
            "permissions": ["saas.read"],
        },
    )
    assert profile.status_code == 201
    assert profile.json()["version"] == 1
    assert profile.json()["permissions"] == ["saas.read"]
    assert access_client.get("/api/v1/access/permissions").json()[0]["code"] == "saas.read"
    assert access_client.get("/api/v1/access/profiles").json()[0]["name"] == "Gestor de produto"


def test_profile_rejects_unknown_permission(access_client):
    response = access_client.post(
        "/api/v1/access/profiles",
        json={"name": "Inválido", "permissions": ["missing.permission"]},
    )

    assert response.status_code == 422
    assert response.json()["error_code"] == "UNKNOWN_PERMISSION"


def test_superadmin_builds_organization_and_effective_user_access(access_client):
    permission = access_client.post(
        "/api/v1/access/permissions",
        json={"code": "saas.read", "resource": "saas", "action": "read", "scope": "tenant"},
    ).json()
    profile = access_client.post(
        "/api/v1/access/profiles",
        json={"name": "Gestor", "permissions": [permission["code"]]},
    ).json()
    department = access_client.post(
        "/api/v1/access/organization-units",
        json={"kind": "department", "name": "Conteúdo"},
    )
    assert department.status_code == 201
    team = access_client.post(
        "/api/v1/access/organization-units",
        json={"kind": "team", "name": "Redes sociais", "parent_id": department.json()["id"]},
    )
    assert team.status_code == 201

    user = access_client.get("/api/v1/access/managers").json()[0]
    assigned = access_client.put(
        f"/api/v1/access/users/{user['id']}/assignment",
        json={
            "profile_id": profile["id"],
            "organization_unit_id": team.json()["id"],
            "job_title": "Diretor de conteúdo",
            "function_name": "Aprovador",
            "scope": {"products": ["mediamind-ai"]},
            "allow_permissions": ["content.publish"],
            "deny_permissions": ["saas.delete"],
        },
    )
    assert assigned.status_code == 200

    effective = access_client.get(f"/api/v1/access/users/{user['id']}/effective-access")
    assert effective.status_code == 200
    assert effective.json()["profile"]["name"] == "Gestor"
    assert effective.json()["organization_path"] == ["Conteúdo", "Redes sociais"]
    assert effective.json()["permissions"] == ["content.publish", "saas.read"]
    assert effective.json()["denied_permissions"] == ["saas.delete"]
    assert effective.json()["scope"] == {"products": ["mediamind-ai"]}


def test_organization_parent_must_belong_to_selected_tenant(access_client):
    response = access_client.post(
        "/api/v1/access/organization-units",
        json={
            "kind": "team",
            "name": "Equipe inválida",
            "parent_id": "00000000-0000-0000-0000-000000000000",
        },
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "ORGANIZATION_PARENT_INVALID"
