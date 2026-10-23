# ruff: noqa: F811
from backend.tests.test_access_api import access_client as access_client_fixture  # noqa: F401

SECOND_PASSWORD = "Senha-temporaria-2026!"


def login_as_second_superadmin(client):
    created = client.post(
        "/api/v1/access/managers",
        json={
            "full_name": "Aprovadora",
            "email": "aprovadora@example.com",
            "role": "superadmin",
            "password": SECOND_PASSWORD,
        },
    )
    assert created.status_code == 201
    client.post("/api/v1/auth/logout")
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "aprovadora@example.com", "password": SECOND_PASSWORD},
    )
    assert response.status_code == 200


def create_sensitive(client):
    created = client.post(
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
    return created.json()


def test_operation_lifecycle_is_persisted_and_audited(access_client_fixture):
    created = create_sensitive(access_client_fixture)
    login_as_second_superadmin(access_client_fixture)

    approved = access_client_fixture.patch(
        f"/api/v1/operations/{created['id']}/status",
        json={"status": "queued", "reason": "Aprovado pelo superadmin"},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "queued"
    assert (
        access_client_fixture.get("/api/v1/operations?saas=MediaMind%20AI").json()[0]["id"]
        == created["id"]
    )


def test_requester_cannot_approve_own_operation(access_client_fixture):
    created = create_sensitive(access_client_fixture)

    response = access_client_fixture.patch(
        f"/api/v1/operations/{created['id']}/status",
        json={"status": "queued", "reason": "Eu mesmo aprovo"},
    )

    assert response.status_code == 403
    assert response.json()["error_code"] == "OPERATION_SELF_APPROVAL_FORBIDDEN"
    listed = access_client_fixture.get("/api/v1/operations").json()
    assert listed[0]["status"] == "awaiting_confirmation"


def test_requester_can_cancel_own_operation(access_client_fixture):
    created = create_sensitive(access_client_fixture)

    response = access_client_fixture.patch(
        f"/api/v1/operations/{created['id']}/status",
        json={"status": "cancelled", "reason": "Pedido por engano"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


def test_legacy_operation_without_requester_id_blocks_self_approval_by_email(
    access_client_fixture,
):
    created = create_sensitive(access_client_fixture)
    from app.db.session import get_session
    from app.models.operation import AdminOperation

    override = access_client_fixture.app.dependency_overrides[get_session]
    for session in override():
        item = session.get(AdminOperation, created["id"])
        item.requested_by_user_id = None
        item.requested_by = "ALEX@example.com"
        session.commit()

    response = access_client_fixture.patch(
        f"/api/v1/operations/{created['id']}/status",
        json={"status": "queued"},
    )

    assert response.status_code == 403
    assert response.json()["error_code"] == "OPERATION_SELF_APPROVAL_FORBIDDEN"


def test_non_sensitive_operation_enters_queue(access_client_fixture):
    response = access_client_fixture.post(
        "/api/v1/operations",
        json={"saas": "Central", "action": "sync users", "dry_run": True},
    )
    assert response.status_code == 201
    assert response.json()["status"] == "queued"


def test_configuration_approval_status_is_not_client_controlled(access_client_fixture):
    response = access_client_fixture.post(
        "/api/v1/configurations",
        json={"key": "feature.x", "value": "on", "approval_status": "approved"},
    )

    assert response.status_code == 201
    assert response.json()["approval_status"] == "auto"


def test_operation_requester_comes_from_session(access_client_fixture):
    response = access_client_fixture.post(
        "/api/v1/operations",
        json={"saas": "Central", "action": "sync users", "requested_by": "ceo@empresa.com"},
    )

    assert response.status_code == 201
    assert response.json()["requested_by"] == "alex@example.com"


def test_configuration_author_comes_from_session(access_client_fixture):
    response = access_client_fixture.post(
        "/api/v1/configurations",
        json={"key": "feature.y", "value": "on", "author": "ceo@empresa.com"},
    )

    assert response.status_code == 201
    assert response.json()["author"] == "alex@example.com"
