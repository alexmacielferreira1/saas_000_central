from datetime import UTC, datetime, timedelta

from backend.tests.test_saas_registry_api import (  # noqa: F401
    PASSWORD,
    login,
    product_payload,
    registry_client,
)


def connection_payload(product_id, **overrides):
    payload = {
        "saas_product_id": product_id,
        "name": "MediaMind Admin API",
        "environment": "local",
        "base_url": "http://127.0.0.1:8000",
        "credential_ref": "MEDIAMIND_HUB_ADMIN_TOKEN",
        "freshness_ttl_seconds": 90,
    }
    payload.update(overrides)
    return payload


def create_product(client, **overrides):
    response = client.post("/api/v1/saas", json=product_payload(**overrides))
    assert response.status_code == 201
    return response.json()


def test_superadmin_creates_and_lists_persisted_connection_without_exposing_credential_ref(
    registry_client,  # noqa: F811
):
    client, _ = registry_client
    login(client)
    product = create_product(client)

    created = client.post(
        "/api/v1/integrations/connections",
        json=connection_payload(product["id"]),
    )

    assert created.status_code == 201
    assert created.json()["product"]["slug"] == "mediamind-ai"
    assert created.json()["environment"] == "local"
    assert created.json()["base_url"] == "http://127.0.0.1:8000"
    assert created.json()["credential_ref_hint"] == "MEDI••••OKEN"
    assert "MEDIAMIND_HUB_ADMIN_TOKEN" not in created.text

    listed = client.get("/api/v1/integrations/connections")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [created.json()["id"]]

    audit = client.get("/api/v1/audit").json()[0]
    assert audit["action"] == "integration.connection.create"
    assert audit["resource_id"] == created.json()["id"]
    assert "credential_ref" not in str(audit)


def test_viewer_cannot_create_connection(registry_client):  # noqa: F811
    client, factory = registry_client
    login(client)
    product = create_product(client)

    from app.models.identity import Membership

    with factory() as session:
        membership = session.query(Membership).one()
        membership.role = "viewer"
        session.commit()

    response = client.post(
        "/api/v1/integrations/connections",
        json=connection_payload(product["id"]),
    )

    assert response.status_code == 403


def test_connections_are_isolated_by_selected_organization(registry_client):  # noqa: F811
    client, factory = registry_client
    login(client)
    central_product = create_product(client)
    central_connection = client.post(
        "/api/v1/integrations/connections",
        json=connection_payload(central_product["id"]),
    )
    assert central_connection.status_code == 201

    from app.models.identity import Membership, Tenant, User
    from app.security.passwords import hash_password

    with factory() as session:
        other_user = User(
            email="other@example.com",
            email_normalized="other@example.com",
            password_hash=hash_password(PASSWORD),
            full_name="Outra pessoa",
        )
        other_tenant = Tenant(name="Outra organização", slug="outra")
        session.add_all([other_user, other_tenant])
        session.flush()
        session.add(Membership(user_id=other_user.id, tenant_id=other_tenant.id, role="superadmin"))
        session.commit()

    client.post("/api/v1/auth/logout")
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "other@example.com", "password": PASSWORD},
        ).status_code
        == 200
    )
    other_product = create_product(client, name="Outro SaaS", slug="outro-saas")
    other_connection = client.post(
        "/api/v1/integrations/connections",
        json=connection_payload(
            other_product["id"],
            name="Outro Admin API",
            credential_ref="OTHER_HUB_TOKEN",
        ),
    )
    assert other_connection.status_code == 201

    client.post("/api/v1/auth/logout")
    login(client)
    visible = client.get("/api/v1/integrations/connections").json()
    assert [item["id"] for item in visible] == [central_connection.json()["id"]]


def test_observation_freshness_distinguishes_confirmed_and_stale_naive_timestamps(
    registry_client,  # noqa: F811
):
    client, factory = registry_client
    login(client)
    product = create_product(client)
    connection = client.post(
        "/api/v1/integrations/connections",
        json=connection_payload(product["id"], freshness_ttl_seconds=60),
    )
    assert connection.status_code == 201

    from app.models.integration import IntegrationObservation, SaasEnvironment

    now = datetime.now(UTC)
    with factory() as session:
        environment = session.query(SaasEnvironment).one()
        session.add_all(
            [
                IntegrationObservation(
                    tenant_id=environment.tenant_id,
                    connection_id=environment.connection_id,
                    environment_id=environment.id,
                    status="healthy",
                    source="mediamind-ai",
                    evidence={"database": "ready"},
                    observed_at=(now - timedelta(seconds=5)).replace(tzinfo=None),
                ),
                IntegrationObservation(
                    tenant_id=environment.tenant_id,
                    connection_id=environment.connection_id,
                    environment_id=environment.id,
                    status="healthy",
                    source="mediamind-ai",
                    evidence={"database": "ready"},
                    observed_at=(now - timedelta(seconds=120)).replace(tzinfo=None),
                ),
            ]
        )
        session.commit()

    response = client.get(
        "/api/v1/integrations/observations",
        params={"connection_id": connection.json()["id"]},
    )

    assert response.status_code == 200
    by_state = {item["freshness"]: item for item in response.json()}
    assert by_state["confirmed"]["status"] == "healthy"
    assert by_state["stale"]["status"] == "healthy"
    assert by_state["confirmed"]["source"] == "mediamind-ai"


def test_probe_without_token_runs_basic_public_check_and_records_missing_credential(
    registry_client,  # noqa: F811
    monkeypatch,
):
    from app.services.connectors.base import ProbeResult

    client, _ = registry_client
    login(client)
    product = create_product(client)
    connection = client.post(
        "/api/v1/integrations/connections",
        json=connection_payload(product["id"]),
    ).json()
    monkeypatch.delenv("MEDIAMIND_HUB_ADMIN_TOKEN", raising=False)
    seen = {}

    class Connector:
        def probe(self, correlation_id):
            return ProbeResult(status="healthy", latency_ms=3, evidence={"contract": "public"})

    def factory(product_slug, base_url, token):
        seen["token"] = token
        return Connector()

    monkeypatch.setattr("app.api.v1.integrations.connector_for", factory)

    response = client.post(f"/api/v1/integrations/connections/{connection['id']}/probe")

    assert response.status_code == 200
    payload = response.json()
    assert seen["token"] is None
    assert payload["status"] == "healthy"
    assert payload["evidence"]["credential"] == "missing"
    assert payload["evidence"]["contract"] == "public"
    assert payload["freshness"] == "confirmed"
    listed = client.get("/api/v1/integrations/observations").json()
    assert listed[0]["id"] == payload["id"]
    audit = client.get("/api/v1/audit").json()[0]
    assert audit["action"] == "integration.connection.probe"


def test_probe_uses_connector_and_persists_manifest_and_health(
    registry_client,  # noqa: F811
    monkeypatch,
):
    client, _ = registry_client
    login(client)
    product = create_product(client)
    connection = client.post(
        "/api/v1/integrations/connections", json=connection_payload(product["id"])
    ).json()
    monkeypatch.setenv("MEDIAMIND_HUB_ADMIN_TOKEN", "secret-test-token")

    from app.services.connectors.base import ProbeResult

    class Connector:
        def probe(self, correlation_id):
            assert correlation_id
            return ProbeResult(
                status="healthy",
                latency_ms=12,
                evidence={
                    "health": {"status": "healthy"},
                    "manifest": {"admin_api_version": "v1"},
                },
            )

    monkeypatch.setattr(
        "app.api.v1.integrations.connector_for", lambda product_slug, base_url, token: Connector()
    )

    response = client.post(f"/api/v1/integrations/connections/{connection['id']}/probe")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["latency_ms"] == 12
    assert response.json()["evidence"]["manifest"]["admin_api_version"] == "v1"


def test_connection_rejects_non_connector_credential_refs_and_userinfo_urls(
    registry_client,  # noqa: F811
):
    client, _ = registry_client
    login(client)
    product = create_product(client)

    for ref in ["DATABASE_URL", "GOOGLE_CLIENT_SECRET", "BOOTSTRAP_ADMIN_PASSWORD"]:
        response = client.post(
            "/api/v1/integrations/connections",
            json=connection_payload(product["id"], credential_ref=ref),
        )
        assert response.status_code == 422, ref

    response = client.post(
        "/api/v1/integrations/connections",
        json=connection_payload(product["id"], base_url="http://user:pass@evil.test"),
    )
    assert response.status_code == 422
    assert client.get("/api/v1/integrations/connections").json() == []


def test_probe_never_reads_settings_from_legacy_disallowed_credential_ref(
    registry_client,  # noqa: F811
    monkeypatch,
):
    client, factory = registry_client
    login(client)
    product = create_product(client)
    connection = client.post(
        "/api/v1/integrations/connections", json=connection_payload(product["id"])
    ).json()

    from app.models.integration import SaasConnection

    with factory() as session:
        session.get(SaasConnection, connection["id"]).credential_ref = "DATABASE_URL"
        session.commit()
    monkeypatch.setenv("DATABASE_URL", "postgresql://secret")

    def forbidden(*args, **kwargs):
        raise AssertionError("connector must not be called with a disallowed credential")

    monkeypatch.setattr("app.api.v1.integrations.connector_for", forbidden)

    response = client.post(f"/api/v1/integrations/connections/{connection['id']}/probe")

    assert response.status_code == 200
    assert response.json()["status"] == "not_configured"
    assert response.json()["failure_code"] == "CREDENTIAL_REFERENCE_NOT_ALLOWED"
    assert "postgresql://secret" not in response.text


def probe_with(client, monkeypatch, product, result):
    connection = client.post(
        "/api/v1/integrations/connections", json=connection_payload(product["id"])
    ).json()
    monkeypatch.setenv("MEDIAMIND_HUB_ADMIN_TOKEN", "secret-test-token")

    class Connector:
        def probe(self, correlation_id):
            return result

    monkeypatch.setattr(
        "app.api.v1.integrations.connector_for", lambda product_slug, base_url, token: Connector()
    )
    response = client.post(f"/api/v1/integrations/connections/{connection['id']}/probe")
    assert response.status_code == 200
    return client.get(f"/api/v1/saas/{product['id']}").json()


def test_successful_public_probe_updates_saas_inventory_with_observed_state(
    registry_client,  # noqa: F811
    monkeypatch,
):
    from app.services.connectors.base import ProbeResult

    client, _ = registry_client
    login(client)
    product = create_product(client)

    saas = probe_with(
        client,
        monkeypatch,
        product,
        ProbeResult(
            status="healthy",
            latency_ms=8,
            evidence={"contract": "public", "version": {"version": "0.1.0"}},
        ),
    )

    assert saas["status"] == "connected"
    assert saas["health"] == "healthy"
    assert saas["version"] == "0.1.0"
    assert saas["compatibility"] == "limited"
    assert saas["last_handshake"] is not None
    audit = client.get("/api/v1/audit").json()[0]
    assert audit["action"] == "integration.connection.probe"
    assert audit["after_data"]["product"]["health"] == "healthy"


def test_unreachable_probe_marks_saas_down_without_a_handshake(
    registry_client,  # noqa: F811
    monkeypatch,
):
    from app.services.connectors.base import ProbeResult

    client, _ = registry_client
    login(client)
    product = create_product(client)

    saas = probe_with(
        client,
        monkeypatch,
        product,
        ProbeResult(status="unavailable", latency_ms=5000, evidence={}, failure_code="X"),
    )

    assert saas["status"] == "unavailable"
    assert saas["health"] == "down"
    assert saas["last_handshake"] is None


def test_probe_with_disallowed_credential_does_not_change_saas_inventory(
    registry_client,  # noqa: F811
):
    client, factory = registry_client
    login(client)
    product = create_product(client)
    before = client.get(f"/api/v1/saas/{product['id']}").json()
    connection = client.post(
        "/api/v1/integrations/connections", json=connection_payload(product["id"])
    ).json()

    from app.models.integration import SaasConnection

    with factory() as session:
        session.get(SaasConnection, connection["id"]).credential_ref = "SECRET_KEY"
        session.commit()

    client.post(f"/api/v1/integrations/connections/{connection['id']}/probe")

    after = client.get(f"/api/v1/saas/{product['id']}").json()
    for key in ("status", "health", "version", "compatibility", "last_handshake"):
        assert after[key] == before[key]
