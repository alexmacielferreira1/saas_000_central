from backend.tests.test_access_api import access_client as access_client_fixture  # noqa: F401


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
