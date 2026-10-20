import httpx

from backend.tests.test_access_api import access_client as access_client_fixture  # noqa: F401
from backend.tests.test_saas_registry_api import product_payload


def test_operation_lifecycle_is_persisted_and_audited(access_client_fixture):  # noqa: F811
    created = access_client_fixture.post(
        "/api/v1/operations",
        json={
            "saas": "MediaMind AI",
            "resource": "user:42",
            "action": "suspend user",
            "reason": "Acesso indevido",
        },
    )
    assert created.status_code == 201
    assert created.json()["status"] == "awaiting_confirmation"

    approved = access_client_fixture.patch(
        f"/api/v1/operations/{created.json()['id']}/status",
        json={"status": "queued", "reason": "Aprovado pelo superadmin"},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "queued"
    assert (
        access_client_fixture.get("/api/v1/operations?saas=MediaMind%20AI").json()[0]["id"]
        == created.json()["id"]
    )


def test_non_sensitive_operation_enters_queue(access_client_fixture):  # noqa: F811
    response = access_client_fixture.post(
        "/api/v1/operations",
        json={"saas": "Central", "action": "sync users", "dry_run": True},
    )
    assert response.status_code == 201
    assert response.json()["status"] == "queued"


def test_read_only_operation_is_dispatched_and_reconciled_once(
    access_client_fixture,  # noqa: F811
    monkeypatch,
):
    product = access_client_fixture.post("/api/v1/saas", json=product_payload()).json()
    access_client_fixture.post(
        "/api/v1/integrations/connections",
        json={
            "saas_product_id": product["id"],
            "name": "MediaMind local",
            "environment": "local",
            "base_url": "http://127.0.0.1:8000",
            "credential_ref": "MEDIAMIND_HUB_ADMIN_TOKEN",
        },
    )
    monkeypatch.setenv("MEDIAMIND_HUB_ADMIN_TOKEN", "secret-test-token")

    calls = []

    class Connector:
        def execute_operation(self, action, payload, idempotency_key):
            calls.append((action, payload, idempotency_key))
            return {"id": "remote-command-1", "status": "succeeded", "result": {"assets": 7}}

        def get_operation_status(self, remote_operation_id):
            assert remote_operation_id == "remote-command-1"
            return {"id": remote_operation_id, "status": "succeeded", "result": {"assets": 7}}

    monkeypatch.setattr(
        "app.api.v1.operations.connector_for", lambda product_slug, base_url, token: Connector()
    )
    created = access_client_fixture.post(
        "/api/v1/operations",
        json={"saas": product["slug"], "action": "media.count", "dry_run": True},
    ).json()

    first = access_client_fixture.post(f"/api/v1/operations/{created['id']}/execute")
    replay = access_client_fixture.post(f"/api/v1/operations/{created['id']}/execute")

    assert first.status_code == 200
    assert first.json()["status"] == "succeeded"
    assert first.json()["remote_operation_id"] == "remote-command-1"
    assert first.json()["result"] == {"assets": 7}
    assert replay.status_code == 200
    assert len(calls) == 1
    assert calls[0][0] == "media.count"
    assert calls[0][2] == created["id"]


def test_remote_execution_rejects_non_allowlisted_or_non_dry_run_operation(
    access_client_fixture,  # noqa: F811
):
    mutation = access_client_fixture.post(
        "/api/v1/operations",
        json={"saas": "mediamind-ai", "action": "users.delete", "dry_run": False},
    ).json()

    response = access_client_fixture.post(f"/api/v1/operations/{mutation['id']}/execute")

    assert response.status_code == 409
    assert response.json()["error_code"] == "OPERATION_REMOTE_ACTION_NOT_ALLOWED"


def test_remote_timeout_is_persisted_as_failure(access_client_fixture, monkeypatch):  # noqa: F811
    product = access_client_fixture.post("/api/v1/saas", json=product_payload()).json()
    access_client_fixture.post(
        "/api/v1/integrations/connections",
        json={
            "saas_product_id": product["id"],
            "name": "MediaMind local",
            "environment": "local",
            "base_url": "http://127.0.0.1:8000",
            "credential_ref": "MEDIAMIND_HUB_ADMIN_TOKEN",
        },
    )
    monkeypatch.setenv("MEDIAMIND_HUB_ADMIN_TOKEN", "secret-test-token")

    class Connector:
        def execute_operation(self, action, payload, idempotency_key):
            raise httpx.TimeoutException("remote timeout")

    monkeypatch.setattr(
        "app.api.v1.operations.connector_for", lambda product_slug, base_url, token: Connector()
    )
    created = access_client_fixture.post(
        "/api/v1/operations",
        json={"saas": product["slug"], "action": "system.describe", "dry_run": True},
    ).json()

    response = access_client_fixture.post(f"/api/v1/operations/{created['id']}/execute")

    assert response.status_code == 502
    stored = access_client_fixture.get(f"/api/v1/operations?saas={product['slug']}").json()[0]
    assert stored["status"] == "failed"
    assert stored["failure_code"] == "REMOTE_TIMEOUT"


def test_remote_connection_error_is_persisted_as_failure(
    access_client_fixture,  # noqa: F811
    monkeypatch,
):
    product = access_client_fixture.post("/api/v1/saas", json=product_payload()).json()
    access_client_fixture.post(
        "/api/v1/integrations/connections",
        json={
            "saas_product_id": product["id"],
            "name": "MediaMind local",
            "environment": "local",
            "base_url": "http://127.0.0.1:8000",
            "credential_ref": "MEDIAMIND_HUB_ADMIN_TOKEN",
        },
    )
    monkeypatch.setenv("MEDIAMIND_HUB_ADMIN_TOKEN", "secret-test-token")

    class Connector:
        def execute_operation(self, action, payload, idempotency_key):
            request = httpx.Request("POST", "http://127.0.0.1:8000/api/hub/v1/commands")
            raise httpx.ConnectError("connection refused", request=request)

    monkeypatch.setattr(
        "app.api.v1.operations.connector_for", lambda product_slug, base_url, token: Connector()
    )
    created = access_client_fixture.post(
        "/api/v1/operations",
        json={"saas": product["slug"], "action": "system.describe", "dry_run": True},
    ).json()

    response = access_client_fixture.post(f"/api/v1/operations/{created['id']}/execute")

    assert response.status_code == 502
    assert response.json()["error_code"] == "OPERATION_REMOTE_UNAVAILABLE"
    stored = access_client_fixture.get(f"/api/v1/operations?saas={product['slug']}").json()[0]
    assert stored["status"] == "failed"
    assert stored["failure_code"] == "REMOTE_UNAVAILABLE"
