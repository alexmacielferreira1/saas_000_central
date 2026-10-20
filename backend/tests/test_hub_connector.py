import httpx
import pytest
from app.services.connectors import (
    HubConnector,
    MediaMindConnector,
    connector_for,
    is_allowed_credential_ref,
)
from app.services.connectors.hub import MAX_EVIDENCE_CHARS


def connector(routes):
    seen = []

    def handler(request: httpx.Request):
        seen.append(request)
        status, body = routes.get(request.url.path, (404, {"detail": "Not Found"}))
        return httpx.Response(status, json=body)

    return HubConnector("http://saas.test/", "secret-token", httpx.MockTransport(handler)), seen


def test_admin_contract_reports_health_and_manifest_with_credential():
    hub, seen = connector(
        {
            "/api/v1/admin/health": (200, {"status": "ok"}),
            "/api/v1/admin/manifest": (200, {"admin_api_version": "v1"}),
        }
    )

    result = hub.probe("corr-1")

    assert result.status == "healthy"
    assert result.failure_code is None
    assert result.evidence["contract"] == "admin"
    assert result.evidence["manifest"] == {"admin_api_version": "v1"}
    assert all(r.headers["Authorization"] == "Bearer secret-token" for r in seen)
    assert all(r.headers["X-Correlation-ID"] == "corr-1" for r in seen)


def test_falls_back_to_public_hub_contract_without_sending_the_credential():
    hub, seen = connector(
        {
            "/ready": (200, {"status": "ready", "service": "mediamind", "database": "ok"}),
            "/version": (200, {"service": "mediamind", "version": "0.1.0"}),
        }
    )

    result = hub.probe("corr-2")

    assert result.status == "healthy"
    assert result.evidence["contract"] == "public"
    assert result.evidence["version"]["version"] == "0.1.0"
    public = [r for r in seen if not r.url.path.startswith("/api/v1/admin")]
    assert [r.url.path for r in public] == ["/ready", "/version"]
    assert all("Authorization" not in r.headers for r in public)


def test_without_token_only_the_public_contract_is_checked():
    seen = []

    def handler(request: httpx.Request):
        seen.append(request.url.path)
        return httpx.Response(200, json={"status": "ready", "version": "2.0.0"})

    hub = HubConnector("http://saas.test", None, httpx.MockTransport(handler))

    result = hub.probe("corr-8")

    assert result.status == "healthy"
    assert seen == ["/ready", "/version"]


def test_public_contract_reports_unavailable_database():
    hub, _ = connector({"/ready": (503, {"status": "unavailable", "database": "down"})})

    result = hub.probe("corr-3")

    assert result.status == "unavailable"
    assert result.failure_code == "REMOTE_HTTP_503"


def test_missing_hub_contract_is_incompatible():
    hub, _ = connector({})

    result = hub.probe("corr-4")

    assert result.status == "incompatible"
    assert result.failure_code == "HUB_CONTRACT_MISSING"


@pytest.mark.parametrize("payload", [["ok"], {"service": "x"}, "ok"])
def test_unexpected_health_payload_is_degraded_not_a_crash(payload):
    hub, _ = connector(
        {
            "/api/v1/admin/health": (200, payload),
            "/api/v1/admin/manifest": (200, {}),
        }
    )

    assert hub.probe("corr-5").status == "degraded"


def test_large_remote_evidence_is_truncated():
    hub, _ = connector(
        {
            "/api/v1/admin/health": (200, {"status": "ok"}),
            "/api/v1/admin/manifest": (200, {"blob": "x" * (MAX_EVIDENCE_CHARS * 2)}),
        }
    )

    manifest = hub.probe("corr-6").evidence["manifest"]

    assert manifest["truncated"] is True
    assert len(manifest["preview"]) == MAX_EVIDENCE_CHARS


def test_unreachable_saas_is_unavailable():
    def handler(request):
        raise httpx.ConnectError("refused", request=request)

    hub = HubConnector("http://saas.test", "t", httpx.MockTransport(handler))

    result = hub.probe("corr-7")

    assert result.status == "unavailable"
    assert result.failure_code == "REMOTE_UNREACHABLE"


def test_factory_uses_generic_hub_connector_for_any_product():
    assert type(connector_for("mediamind-ai", "http://a", "t")) is MediaMindConnector
    assert type(connector_for("clinica-gabrielli", "http://a", "t")) is HubConnector


@pytest.mark.parametrize(
    ("value", "allowed"),
    [
        ("MEDIAMIND_HUB_ADMIN_TOKEN", True),
        ("CLINICA_HUB_TOKEN", True),
        ("DATABASE_URL", False),
        ("GOOGLE_CLIENT_SECRET", False),
        ("BOOTSTRAP_ADMIN_PASSWORD", False),
        ("HUB_TOKEN", False),
        ("mediamind_hub_token", False),
        ("", False),
    ],
)
def test_only_dedicated_connector_tokens_are_allowed(value, allowed):
    assert is_allowed_credential_ref(value) is allowed
