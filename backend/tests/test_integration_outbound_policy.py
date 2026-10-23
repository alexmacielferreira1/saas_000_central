# ruff: noqa: F811
import socket

import httpx
import pytest
from app.services.connectors.mediamind import MediaMindConnector
from app.services.connectors.outbound import (
    OutboundPolicyError,
    bound_evidence,
    parse_credential_bindings,
    validate_credential_ref,
    validate_target,
)

from backend.tests.test_integrations_api import connection_payload, create_product
from backend.tests.test_saas_registry_api import login, registry_client  # noqa: F401

REF = "MEDIAMIND_HUB_ADMIN_TOKEN"
BINDINGS = {REF: ["mediamind.example.com"]}


def resolver_for(*addresses):
    def resolve(host, port, *args, **kwargs):
        return [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, port)) for address in addresses
        ]

    return resolve


@pytest.mark.parametrize(
    "ref",
    [
        "DATABASE_URL",
        "GOOGLE_CLIENT_SECRET",
        "BOOTSTRAP_ADMIN_PASSWORD",
        "POSTGRES_PASSWORD",
        "HUB_ADMIN_TOKEN",
        "OTHER_HUB_TOKEN",
        "database_url",
    ],
)
def test_credential_ref_outside_integration_namespace_is_rejected(ref):
    with pytest.raises(OutboundPolicyError) as error:
        validate_credential_ref(ref)
    assert error.value.code == "INTEGRATION_CREDENTIAL_REF_NOT_ALLOWED"


def test_integration_credential_ref_is_accepted():
    validate_credential_ref(REF)
    validate_credential_ref("SAAS_HUB_ADMIN_TOKEN")


@pytest.mark.parametrize(
    "url,code",
    [
        ("http://mediamind.example.com", "INTEGRATION_TARGET_HTTPS_REQUIRED"),
        ("https://user:pass@mediamind.example.com", "INTEGRATION_TARGET_INVALID"),
        ("https://mediamind.example.com/?x=1", "INTEGRATION_TARGET_INVALID"),
        ("ftp://mediamind.example.com", "INTEGRATION_TARGET_INVALID"),
        ("https://attacker.example", "INTEGRATION_TARGET_NOT_ALLOWED"),
    ],
)
def test_production_target_policy_rejects_unsafe_urls(url, code):
    with pytest.raises(OutboundPolicyError) as error:
        validate_target(
            url,
            REF,
            environment="production",
            bindings=BINDINGS,
            resolver=resolver_for("93.184.216.34"),
        )
    assert error.value.code == code


def test_production_requires_explicit_host_binding_for_credential():
    with pytest.raises(OutboundPolicyError) as error:
        validate_target(
            "https://mediamind.example.com",
            REF,
            environment="production",
            bindings={},
            resolver=resolver_for("93.184.216.34"),
        )
    assert error.value.code == "INTEGRATION_TARGET_NOT_ALLOWED"


@pytest.mark.parametrize(
    "address",
    ["127.0.0.1", "10.0.0.5", "192.168.1.10", "169.254.169.254", "100.64.0.1", "::1", "fd00::1"],
)
def test_production_rejects_hosts_resolving_to_non_public_addresses(address):
    def resolve(host, port, *args, **kwargs):
        family = socket.AF_INET6 if ":" in address else socket.AF_INET
        return [(family, socket.SOCK_STREAM, 6, "", (address, port))]

    with pytest.raises(OutboundPolicyError) as error:
        validate_target(
            "https://mediamind.example.com",
            REF,
            environment="production",
            bindings=BINDINGS,
            resolver=resolve,
        )
    assert error.value.code == "INTEGRATION_TARGET_PRIVATE_ADDRESS"


def test_production_rejects_unresolvable_host():
    def resolve(*args, **kwargs):
        raise socket.gaierror("no such host")

    with pytest.raises(OutboundPolicyError) as error:
        validate_target(
            "https://mediamind.example.com",
            REF,
            environment="production",
            bindings=BINDINGS,
            resolver=resolve,
        )
    assert error.value.code == "INTEGRATION_TARGET_UNRESOLVABLE"


def test_production_accepts_bound_public_https_host():
    validate_target(
        "https://MediaMind.example.com/base",
        REF,
        environment="production",
        bindings=BINDINGS,
        resolver=resolver_for("93.184.216.34"),
    )


def test_local_environment_allows_loopback_http_for_development():
    validate_target(
        "http://127.0.0.1:8000",
        REF,
        environment="local",
        bindings={},
        resolver=resolver_for("127.0.0.1"),
    )


def test_local_environment_still_enforces_configured_binding():
    with pytest.raises(OutboundPolicyError) as error:
        validate_target(
            "http://127.0.0.1:8000",
            REF,
            environment="local",
            bindings=BINDINGS,
            resolver=resolver_for("127.0.0.1"),
        )
    assert error.value.code == "INTEGRATION_TARGET_NOT_ALLOWED"


@pytest.mark.parametrize(
    "raw", ["", "not-json", "[1, 2]", '{"X": "host"}', '{"x_hub_admin_token": 3}']
)
def test_malformed_bindings_fail_closed(raw):
    bindings = parse_credential_bindings(raw)
    assert all(isinstance(hosts, list) for hosts in bindings.values())
    assert "X" not in bindings


def test_bindings_are_normalized():
    assert parse_credential_bindings(
        '{"MEDIAMIND_HUB_ADMIN_TOKEN": ["MediaMind.Example.com", 3]}'
    ) == {REF: ["mediamind.example.com"]}


def test_evidence_is_bounded():
    evidence = bound_evidence({"product": "x", "manifest": {"blob": "a" * 50_000}})
    assert evidence["truncated"] is True
    assert "manifest" not in evidence
    assert evidence["product"] == "x"


def test_connector_does_not_follow_redirects():
    calls = []

    def handler(request):
        calls.append(str(request.url))
        return httpx.Response(302, headers={"Location": "http://169.254.169.254/latest"})

    connector = MediaMindConnector(
        "https://mediamind.example.com", "token", transport=httpx.MockTransport(handler)
    )
    result = connector.probe("corr-1")

    assert result.status == "unavailable"
    assert all(url.startswith("https://mediamind.example.com/") for url in calls)
    assert len(calls) == 2


def test_create_connection_rejects_core_secret_reference(registry_client):  # noqa: F811
    client, _ = registry_client
    login(client)
    product = create_product(client)

    response = client.post(
        "/api/v1/integrations/connections",
        json=connection_payload(product["id"], credential_ref="DATABASE_URL"),
    )

    assert response.status_code == 422
    assert response.json()["error_code"] == "INTEGRATION_CREDENTIAL_REF_NOT_ALLOWED"


def test_create_connection_rejects_unsafe_target_in_production(
    registry_client,
    monkeypatch,  # noqa: F811
):
    client, _ = registry_client
    login(client)
    product = create_product(client)
    monkeypatch.setattr(
        "app.api.v1.integrations.outbound_context",
        lambda: ("production", BINDINGS),
    )

    response = client.post(
        "/api/v1/integrations/connections",
        json=connection_payload(product["id"], base_url="http://169.254.169.254"),
    )

    assert response.status_code == 422
    assert response.json()["error_code"] == "INTEGRATION_TARGET_HTTPS_REQUIRED"


def test_legacy_connection_with_forbidden_reference_fails_closed_without_reading_env(
    registry_client,
    monkeypatch,  # noqa: F811
):
    client, factory = registry_client
    login(client)
    product = create_product(client)
    created = client.post(
        "/api/v1/integrations/connections", json=connection_payload(product["id"])
    ).json()

    from app.models.integration import SaasConnection

    with factory() as session:
        connection = session.get(SaasConnection, created["id"])
        connection.credential_ref = "DATABASE_URL"
        session.commit()

    def forbidden(*args, **kwargs):
        raise AssertionError("connector must not be called")

    monkeypatch.setattr("app.api.v1.integrations.connector_for", forbidden)
    monkeypatch.setenv("DATABASE_URL", "postgresql://secret")

    response = client.post(f"/api/v1/integrations/connections/{created['id']}/probe")

    assert response.status_code == 200
    assert response.json()["status"] == "not_configured"
    assert response.json()["failure_code"] == "INTEGRATION_CREDENTIAL_REF_NOT_ALLOWED"
    assert "secret" not in response.text


def test_probe_rechecks_target_policy_before_sending_credential(
    registry_client,
    monkeypatch,  # noqa: F811
):
    client, _ = registry_client
    login(client)
    product = create_product(client)
    created = client.post(
        "/api/v1/integrations/connections", json=connection_payload(product["id"])
    ).json()
    monkeypatch.setenv("MEDIAMIND_HUB_ADMIN_TOKEN", "secret-test-token")

    def forbidden(*args, **kwargs):
        raise AssertionError("connector must not be called")

    monkeypatch.setattr("app.api.v1.integrations.connector_for", forbidden)
    monkeypatch.setattr(
        "app.api.v1.integrations.outbound_context",
        lambda: ("production", BINDINGS),
    )

    response = client.post(f"/api/v1/integrations/connections/{created['id']}/probe")

    assert response.status_code == 200
    assert response.json()["status"] == "not_configured"
    assert response.json()["failure_code"] == "INTEGRATION_TARGET_HTTPS_REQUIRED"


def test_probe_releases_database_transaction_before_remote_call(
    registry_client,
    monkeypatch,  # noqa: F811
):
    client, _ = registry_client
    login(client)
    product = create_product(client)
    created = client.post(
        "/api/v1/integrations/connections", json=connection_payload(product["id"])
    ).json()
    monkeypatch.setenv("MEDIAMIND_HUB_ADMIN_TOKEN", "secret-test-token")

    from app.db.session import get_session
    from app.services.connectors.base import ProbeResult

    opened = []
    original = client.app.dependency_overrides[get_session]

    def tracking_override():
        for session in original():
            opened.append(session)
            yield session

    client.app.dependency_overrides[get_session] = tracking_override

    class Connector:
        def probe(self, correlation_id):
            assert opened and not opened[-1].in_transaction()
            return ProbeResult(status="healthy", latency_ms=3, evidence={"health": {}})

    monkeypatch.setattr(
        "app.api.v1.integrations.connector_for", lambda slug, base_url, token: Connector()
    )

    response = client.post(f"/api/v1/integrations/connections/{created['id']}/probe")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
