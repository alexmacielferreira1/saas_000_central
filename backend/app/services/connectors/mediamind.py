from time import perf_counter
from typing import Any

import httpx

from app.services.connectors.base import ProbeResult


class MediaMindConnector:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip("/")
        self.token = token

    def _headers(self, scope: str, correlation_id: str | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Hub-Audience": "central",
            "X-Hub-Scopes": scope,
            "X-Hub-Service": "central",
        }
        if correlation_id:
            headers["X-Correlation-ID"] = correlation_id
        return headers

    def _endpoint(self, path: str) -> str:
        if not path.startswith("/") or path.startswith("//"):
            raise ValueError("O manifesto publicou um endpoint fora da origem configurada.")
        return f"{self.base_url}{path}"

    def _manifest_endpoints(self) -> dict[str, str]:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(f"{self.base_url}/.well-known/hub/manifest")
        response.raise_for_status()
        return response.json()["endpoints"]

    def probe(self, correlation_id: str) -> ProbeResult:
        started = perf_counter()
        evidence: dict[str, Any] = {}
        try:
            with httpx.Client(timeout=5.0) as client:
                manifest = client.get(f"{self.base_url}/.well-known/hub/manifest")
                evidence["manifest_http_status"] = manifest.status_code
            if not manifest.is_success:
                return self._result(
                    started, "incompatible", evidence, f"MANIFEST_HTTP_{manifest.status_code}"
                )
            manifest_data = manifest.json()
            endpoints = manifest_data["endpoints"]
            headers = self._headers("hub:observe", correlation_id)
            with httpx.Client(timeout=5.0) as client:
                health = client.get(self._endpoint(endpoints["health"]), headers=headers)
                readiness = client.get(self._endpoint(endpoints["readiness"]), headers=headers)
                version = client.get(self._endpoint(endpoints["version"]), headers=headers)
            evidence.update(
                {
                    "health_http_status": health.status_code,
                    "readiness_http_status": readiness.status_code,
                    "version_http_status": version.status_code,
                    "manifest": manifest_data,
                }
            )
            if not health.is_success:
                return self._result(
                    started, "unavailable", evidence, f"REMOTE_HTTP_{health.status_code}"
                )
            if not readiness.is_success:
                return self._result(
                    started, "degraded", evidence, f"READINESS_HTTP_{readiness.status_code}"
                )
            if not version.is_success:
                return self._result(
                    started, "incompatible", evidence, f"VERSION_HTTP_{version.status_code}"
                )
            health_data = health.json()
            readiness_data = readiness.json()
            evidence.update(
                {"health": health_data, "readiness": readiness_data, "version": version.json()}
            )
            remote_status = str(health_data.get("status", "healthy")).lower()
            ready_status = str(readiness_data.get("status", "ready")).lower()
            status = (
                "healthy"
                if remote_status in {"ok", "healthy"} and ready_status == "ready"
                else "degraded"
            )
            return self._result(started, status, evidence)
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
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
        command_url = self._endpoint(self._manifest_endpoints()["commands"])
        headers = {
            **self._headers("hub:command"),
            "Idempotency-Key": idempotency_key,
        }
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                command_url,
                headers=headers,
                json={"action": action, "dry_run": True, "parameters": payload},
            )
        response.raise_for_status()
        return response.json()

    def get_operation_status(self, remote_operation_id: str):
        command_url = self._endpoint(self._manifest_endpoints()["commands"])
        with httpx.Client(timeout=5.0) as client:
            response = client.get(
                f"{command_url}/{remote_operation_id}",
                headers=self._headers("hub:command"),
            )
        response.raise_for_status()
        return response.json()
