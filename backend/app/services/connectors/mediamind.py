from time import perf_counter
from typing import Any

import httpx

from app.services.connectors.base import ProbeResult


class MediaMindConnector:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip("/")
        self.headers = {"Authorization": f"Bearer {token}"}

    def probe(self, correlation_id: str) -> ProbeResult:
        started = perf_counter()
        headers = {**self.headers, "X-Correlation-ID": correlation_id}
        evidence: dict[str, Any] = {}
        try:
            with httpx.Client(timeout=5.0, headers=headers) as client:
                health = client.get(f"{self.base_url}/api/v1/admin/health")
                manifest = client.get(f"{self.base_url}/api/v1/admin/manifest")
            evidence.update(
                {
                    "health_http_status": health.status_code,
                    "manifest_http_status": manifest.status_code,
                }
            )
            if not health.is_success:
                return self._result(
                    started, "unavailable", evidence, f"REMOTE_HTTP_{health.status_code}"
                )
            if not manifest.is_success:
                return self._result(
                    started, "incompatible", evidence, f"MANIFEST_HTTP_{manifest.status_code}"
                )
            health_data = health.json()
            manifest_data = manifest.json()
            evidence.update({"health": health_data, "manifest": manifest_data})
            remote_status = str(health_data.get("status", "healthy")).lower()
            status = "healthy" if remote_status in {"ok", "ready", "healthy"} else "degraded"
            return self._result(started, status, evidence)
        except (httpx.HTTPError, ValueError) as exc:
            evidence["message"] = str(exc)[:300]
            return self._result(started, "unavailable", evidence, "REMOTE_UNREACHABLE")

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
