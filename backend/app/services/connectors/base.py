from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class ProbeResult:
    status: str
    evidence: dict[str, Any]
    latency_ms: int
    failure_code: str | None = None


class BaseSaasConnector(Protocol):
    def probe(self, correlation_id: str) -> ProbeResult: ...

    def execute_operation(self, action: str, payload: dict[str, Any], idempotency_key: str): ...

    def get_operation_status(self, remote_operation_id: str): ...
