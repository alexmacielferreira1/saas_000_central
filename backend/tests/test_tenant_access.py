# ruff: noqa: F811
import pytest
from app.models.identity import AuthSession, Membership, Tenant

from backend.tests.test_saas_registry_api import (
    login,
    product_payload,
    registry_client,  # noqa: F401
)

TENANT_ROUTES = [
    "/api/v1/saas",
    "/api/v1/manifests",
    "/api/v1/product-users",
    "/api/v1/configurations",
    "/api/v1/operations",
    "/api/v1/integrations/connections",
    "/api/v1/integrations/observations",
    "/api/v1/control-resources",
    "/api/v1/access/managers",
    "/api/v1/access/permissions",
    "/api/v1/access/profiles",
    "/api/v1/access/organization-units",
    "/api/v1/access/assignments",
    "/api/v1/audit",
    "/api/v1/home/summary",
]
MANAGER_PASSWORD = "Senha-temporaria-2026!"


def deactivate_membership(factory):
    with factory() as session:
        session.query(Membership).one().is_active = False
        session.commit()


@pytest.mark.parametrize("route", TENANT_ROUTES)
def test_inactive_membership_loses_read_access_on_every_tenant_route(registry_client, route):
    client, factory = registry_client
    login(client)
    assert client.get(route).status_code == 200
    deactivate_membership(factory)

    response = client.get(route)

    assert response.status_code == 403
    assert response.json()["error_code"] == "TENANT_ACCESS_FORBIDDEN"


@pytest.mark.parametrize("route", TENANT_ROUTES)
def test_inactive_tenant_blocks_existing_sessions(registry_client, route):
    client, factory = registry_client
    login(client)
    with factory() as session:
        session.query(Tenant).one().is_active = False
        session.commit()

    response = client.get(route)

    assert response.status_code == 403
    assert response.json()["error_code"] == "TENANT_ACCESS_FORBIDDEN"


def test_inactive_tenant_blocks_writes(registry_client):
    client, factory = registry_client
    login(client)
    with factory() as session:
        session.query(Tenant).one().is_active = False
        session.commit()

    response = client.post("/api/v1/saas", json=product_payload())

    assert response.status_code == 403
    assert response.json()["error_code"] == "TENANT_ACCESS_FORBIDDEN"


def test_session_without_selected_tenant_is_forbidden_not_internal_error(registry_client):
    client, factory = registry_client
    login(client)
    with factory() as session:
        session.query(AuthSession).one().selected_tenant_id = None
        session.commit()

    response = client.get("/api/v1/access/managers")

    assert response.status_code == 403
    assert response.json()["error_code"] == "TENANT_NOT_SELECTED"


def test_suspending_manager_revokes_existing_sessions(registry_client):
    client, factory = registry_client
    login(client)
    created = client.post(
        "/api/v1/access/managers",
        json={
            "full_name": "Gestora",
            "email": "gestora@example.com",
            "role": "viewer",
            "password": MANAGER_PASSWORD,
        },
    ).json()
    client.post("/api/v1/auth/logout")
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "gestora@example.com", "password": MANAGER_PASSWORD},
        ).status_code
        == 200
    )
    manager_cookie = client.cookies.get("central_session")
    assert client.get("/api/v1/access/managers").status_code == 200

    client.cookies.clear()
    login(client)
    suspended = client.patch(
        f"/api/v1/access/managers/{created['id']}", json={"status": "suspended"}
    )
    assert suspended.status_code == 200

    with factory() as session:
        sessions = session.query(AuthSession).filter_by(user_id=created["id"]).all()
        assert sessions and all(item.revoked_at is not None for item in sessions)

    client.cookies.clear()
    client.cookies.set("central_session", manager_cookie)
    assert client.get("/api/v1/access/managers").status_code == 401
    assert client.get("/api/v1/auth/session").status_code == 401


def test_every_non_auth_api_route_depends_on_tenant_context():
    from app.main import create_app
    from app.tenancy.context import get_tenant_context
    from fastapi.routing import APIRoute

    def dependency_calls(dependant):
        for item in dependant.dependencies:
            yield item.call
            yield from dependency_calls(item)

    unguarded = [
        route.path
        for route in create_app().routes
        if isinstance(route, APIRoute)
        and route.path.startswith("/api/v1/")
        and not route.path.startswith("/api/v1/auth/")
        and get_tenant_context not in set(dependency_calls(route.dependant))
    ]
    assert unguarded == []
