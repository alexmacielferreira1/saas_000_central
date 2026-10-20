import json
from time import perf_counter
from typing import Any

import httpx

from app.services.connectors.base import ProbeResult

HEALTHY_STATES = {"ok", "ready", "healthy"}
MAX_EVIDENCE_CHARS = 16_000


def bounded(data: Any) -> Any:
    """Keep remote evidence small enough to persist; never trust its size."""
    try:
        text = json.dumps(data, ensure_ascii=False, default=str)
    except (TypeError, ValueError):
        return {"truncated": True, "reason": "unserializable"}
    if len(text) <= MAX_EVIDENCE_CHARS:
        return data
    return {"truncated": True, "preview": text[:MAX_EVIDENCE_CHARS]}


def remote_status(payload: Any) -> str:
    if not isinstance(payload, dict) or "status" not in payload:
        return "degraded"
    return "healthy" if str(payload["status"]).lower() in HEALTHY_STATES else "degraded"


class HubConnector:
    """Connector for any HUB SaaS.

    Uses the authenticated admin contract (`/api/v1/admin/health` + `/manifest`) when the
    product publishes it. When it does not (404), falls back to the public HUB standard
    (`/ready` + `/version`) without sending the credential, so every SaaS can be monitored.
    Without a token only the public contract is checked.
    """

    def __init__(
        self, base_url: str, token: str | None, transport: httpx.BaseTransport | None = None
    ):
        self.base_url = base_url.rstrip("/")
        self.headers = {"Authorization": f"Bearer {token}"} if token else None
        self.transport = transport

    def probe(self, correlation_id: str) -> ProbeResult:
        started = perf_counter()
        evidence: dict[str, Any] = {}
        try:
            with httpx.Client(
                timeout=5.0, follow_redirects=False, transport=self.transport
            ) as client:
                if self.headers is None:
                    return self._probe_public(client, correlation_id, started, evidence)
                admin_headers = {**self.headers, "X-Correlation-ID": correlation_id}
                health = client.get(f"{self.base_url}/api/v1/admin/health", headers=admin_headers)
                evidence["health_http_status"] = health.status_code
                if health.status_code == 404:
                    return self._probe_public(client, correlation_id, started, evidence)
                if not health.is_success:
                    return self._result(
                        started, "unavailable", evidence, f"REMOTE_HTTP_{health.status_code}"
                    )
                manifest = client.get(
                    f"{self.base_url}/api/v1/admin/manifest", headers=admin_headers
                )
                evidence["manifest_http_status"] = manifest.status_code
                if not manifest.is_success:
                    return self._result(
                        started, "incompatible", evidence, f"MANIFEST_HTTP_{manifest.status_code}"
                    )
                health_data = health.json()
                evidence.update(
                    {
                        "contract": "admin",
                        "health": bounded(health_data),
                        "manifest": bounded(manifest.json()),
                    }
                )
                return self._result(started, remote_status(health_data), evidence)
        except (httpx.HTTPError, ValueError) as exc:
            evidence["message"] = str(exc)[:300]
            return self._result(started, "unavailable", evidence, "REMOTE_UNREACHABLE")

    def _probe_public(self, client, correlation_id, started, evidence) -> ProbeResult:
        headers = {"X-Correlation-ID": correlation_id}
        ready = client.get(f"{self.base_url}/ready", headers=headers)
        evidence.update({"contract": "public", "ready_http_status": ready.status_code})
        if ready.status_code == 404:
            return self._result(started, "incompatible", evidence, "HUB_CONTRACT_MISSING")
        ready_data = ready.json() if ready.content else {}
        evidence["ready"] = bounded(ready_data)
        version = client.get(f"{self.base_url}/version", headers=headers)
        evidence["version_http_status"] = version.status_code
        if version.is_success:
            evidence["version"] = bounded(version.json())
        if not ready.is_success:
            return self._result(
                started, "unavailable", evidence, f"REMOTE_HTTP_{ready.status_code}"
            )
        return self._result(started, remote_status(ready_data), evidence)

    @staticmethod
    def _result(started: float, status: str, evidence: dict, failure_code: str | None = None):
        return ProbeResult(
            status=status,
            evidence=evidence,
            latency_ms=round((perf_counter() - started) * 1000),
            failure_code=failure_code,
        )

    def execute_operation(self, action: str, payload: dict[str, Any], idempotency_key: str):
        raise NotImplementedError("O contrato de comandos exige uma ação publicada no manifest.")

    def get_operation_status(self, remote_operation_id: str):
        raise NotImplementedError("O endpoint de consulta remota ainda não foi publicado.")
