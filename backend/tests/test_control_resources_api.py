from backend.tests.test_saas_registry_api import PASSWORD, login, registry_client  # noqa: F401


def payload(**overrides):
    value = {
        "kind": "product_module",
        "key": "admin.users",
        "name": "Administração de usuários",
        "description": "Módulo administrativo",
        "status": "active",
        "data": {"route": "/administration"},
    }
    value.update(overrides)
    return value


def test_superadmin_creates_lists_and_audits_control_resource(registry_client):  # noqa: F811
    client, _ = registry_client
    login(client)
    created = client.post("/api/v1/control-resources", json=payload())
    assert created.status_code == 201
    assert created.json()["version"] == 1
    listed = client.get("/api/v1/control-resources", params={"kind": "product_module"})
    assert [item["id"] for item in listed.json()] == [created.json()["id"]]
    assert client.get("/api/v1/audit").json()[0]["action"] == "control.product_module.create"


def test_control_resource_rejects_unknown_kind_and_duplicate(registry_client):  # noqa: F811
    client, _ = registry_client
    login(client)
    assert client.post("/api/v1/control-resources", json=payload(kind="unknown")).status_code == 422
    assert client.post("/api/v1/control-resources", json=payload()).status_code == 201
    assert client.post("/api/v1/control-resources", json=payload()).status_code == 409


def test_superadmin_updates_resource_in_context_and_audits_change(registry_client):  # noqa: F811
    client, _ = registry_client
    login(client)
    created = client.post("/api/v1/control-resources", json=payload()).json()

    response = client.patch(
        f"/api/v1/control-resources/{created['id']}",
        json={
            "name": "Administração central",
            "status": "active",
            "data": {"route": "/administration", "owner": "Plataforma"},
        },
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Administração central"
    assert response.json()["data"]["owner"] == "Plataforma"
    assert response.json()["version"] == 2
    audit = client.get("/api/v1/audit").json()[0]
    assert audit["action"] == "control.product_module.update"
    assert audit["before_data"]["name"] == "Administração de usuários"
    assert audit["after_data"]["name"] == "Administração central"


def test_update_returns_not_found_for_resource_outside_tenant(registry_client):  # noqa: F811
    client, _ = registry_client
    login(client)
    response = client.patch(
        "/api/v1/control-resources/00000000-0000-0000-0000-000000000000",
        json={"status": "paused"},
    )
    assert response.status_code == 404
