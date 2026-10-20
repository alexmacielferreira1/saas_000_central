import httpx
from app.services.connectors.mediamind import MediaMindConnector


class FakeClient:
    requests: list[httpx.Request] = []

    def __init__(self, *args, **kwargs):
        self.headers = kwargs.get("headers", {})

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def get(self, url, headers=None):
        request = httpx.Request("GET", url, headers={**self.headers, **(headers or {})})
        self.requests.append(request)
        if request.url.path == "/.well-known/hub/manifest":
            return httpx.Response(
                200,
                request=request,
                json={
                    "product_id": "mediamind-ai",
                    "admin_api_version": "v1",
                    "endpoints": {
                        "health": "/api/hub/v1/health",
                        "readiness": "/api/hub/v1/readiness",
                        "version": "/api/hub/v1/version",
                        "commands": "/api/hub/v1/remote-commands",
                    },
                },
            )
        if request.url.path.startswith("/api/hub/v1/remote-commands/"):
            payload = {"id": request.url.path.rsplit("/", 1)[-1], "status": "succeeded"}
        else:
            payload = {"status": "ready" if request.url.path.endswith("readiness") else "healthy"}
        return httpx.Response(200, request=request, json=payload)

    def post(self, url, headers=None, json=None):
        request = httpx.Request("POST", url, headers={**self.headers, **(headers or {})}, json=json)
        self.requests.append(request)
        return httpx.Response(
            202,
            request=request,
            json={"id": "d1f5b34d-2775-4c67-8d43-cdbdc6090144", "status": "succeeded"},
        )


def test_probe_discovers_endpoints_and_sends_required_service_identity(monkeypatch):
    FakeClient.requests = []
    monkeypatch.setattr(httpx, "Client", FakeClient)

    result = MediaMindConnector("https://media.example", "secret").probe("corr-123")

    assert result.status == "healthy"
    assert [request.url.path for request in FakeClient.requests] == [
        "/.well-known/hub/manifest",
        "/api/hub/v1/health",
        "/api/hub/v1/readiness",
        "/api/hub/v1/version",
    ]
    protected = FakeClient.requests[1]
    assert protected.headers["authorization"] == "Bearer secret"
    assert protected.headers["x-hub-audience"] == "central"
    assert protected.headers["x-hub-scopes"] == "hub:observe"
    assert protected.headers["x-hub-service"] == "central"
    assert protected.headers["x-correlation-id"] == "corr-123"


def test_execute_read_only_operation_uses_command_scope_and_idempotency(monkeypatch):
    FakeClient.requests = []
    monkeypatch.setattr(httpx, "Client", FakeClient)
    connector = MediaMindConnector("https://media.example", "secret")

    result = connector.execute_operation("system.describe", {}, "same-command")

    assert result["status"] == "succeeded"
    assert [request.url.path for request in FakeClient.requests] == [
        "/.well-known/hub/manifest",
        "/api/hub/v1/remote-commands",
    ]
    request = FakeClient.requests[1]
    assert request.headers["idempotency-key"] == "same-command"
    assert request.headers["x-hub-scopes"] == "hub:command"


def test_get_operation_status_uses_command_scope(monkeypatch):
    FakeClient.requests = []
    monkeypatch.setattr(httpx, "Client", FakeClient)
    connector = MediaMindConnector("https://media.example", "secret")

    result = connector.get_operation_status("d1f5b34d-2775-4c67-8d43-cdbdc6090144")

    assert result["status"] == "succeeded"
    assert [request.url.path for request in FakeClient.requests] == [
        "/.well-known/hub/manifest",
        "/api/hub/v1/remote-commands/d1f5b34d-2775-4c67-8d43-cdbdc6090144",
    ]
    request = FakeClient.requests[1]
    assert request.headers["x-hub-scopes"] == "hub:command"
