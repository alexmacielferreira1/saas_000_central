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
