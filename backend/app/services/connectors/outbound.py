"""Politica de saida para conexoes administrativas com SaaS do HUB.

O probe envia um segredo do ambiente da Central a outro servico. Por isso:

- ``credential_ref`` so pode nomear variaveis do namespace de integracao
  (sufixo ``_HUB_ADMIN_TOKEN``) e nunca um segredo central (denylist explicita);
- ``base_url`` precisa usar https fora de local/test, nao pode conter credenciais,
  query ou fragmento e, depois da resolucao DNS, nao pode apontar para enderecos
  privados, loopback, link-local (metadata), CGNAT, multicast ou reservados;
- fora de local/test cada credencial precisa estar vinculada explicitamente aos hosts
  permitidos em ``INTEGRATION_CREDENTIAL_HOSTS`` (JSON ``{"REF": ["host"]}``). Sem
  essa configuracao a verificacao falha fechada, sem enviar nada.
"""

import ipaddress
import json
import re
import socket
from collections.abc import Callable
from typing import Any
from urllib.parse import urlsplit

CREDENTIAL_REF_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]{1,150}_HUB_ADMIN_TOKEN$")
CORE_SECRET_REFS = frozenset(
    {
        "DATABASE_URL",
        "POSTGRES_PASSWORD",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_CLIENT_ID",
        "BOOTSTRAP_ADMIN_PASSWORD",
        "BOOTSTRAP_ADMIN_EMAIL",
        "INTEGRATION_CREDENTIAL_HOSTS",
    }
)
DEVELOPMENT_ENVIRONMENTS = frozenset({"local", "test"})
MAX_EVIDENCE_BYTES = 16_000
Resolver = Callable[..., list]


class OutboundPolicyError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(code)
        self.code = code
        self.message = message


def validate_credential_ref(credential_ref: str) -> None:
    if credential_ref in CORE_SECRET_REFS or not CREDENTIAL_REF_PATTERN.fullmatch(
        credential_ref or ""
    ):
        raise OutboundPolicyError(
            "INTEGRATION_CREDENTIAL_REF_NOT_ALLOWED",
            "A referência de credencial deve terminar em _HUB_ADMIN_TOKEN e não pode "
            "apontar para segredos da Central.",
        )


def parse_credential_bindings(raw: str | None) -> dict[str, list[str]]:
    """Le o vinculo credencial -> hosts. Qualquer formato invalido vira vazio (falha fechada)."""
    try:
        data = json.loads(raw or "{}")
    except (TypeError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    bindings: dict[str, list[str]] = {}
    for ref, hosts in data.items():
        if not isinstance(ref, str) or not isinstance(hosts, list):
            continue
        try:
            validate_credential_ref(ref)
        except OutboundPolicyError:
            continue
        normalized = [host.strip().lower() for host in hosts if isinstance(host, str) and host]
        if normalized:
            bindings[ref] = normalized
    return bindings


def _is_public(address: str) -> bool:
    ip = ipaddress.ip_address(address.split("%", 1)[0])
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    return ip.is_global and not ip.is_multicast


def validate_target(
    base_url: str,
    credential_ref: str,
    *,
    environment: str,
    bindings: dict[str, list[str]],
    resolver: Resolver = socket.getaddrinfo,
) -> None:
    validate_credential_ref(credential_ref)
    try:
        parts = urlsplit(base_url)
        port = parts.port
    except ValueError as exc:
        raise OutboundPolicyError("INTEGRATION_TARGET_INVALID", "URL de destino inválida.") from exc
    host = (parts.hostname or "").lower()
    if (
        parts.scheme not in {"http", "https"}
        or not host
        or parts.username is not None
        or parts.password is not None
        or parts.query
        or parts.fragment
    ):
        raise OutboundPolicyError("INTEGRATION_TARGET_INVALID", "URL de destino inválida.")

    development = environment in DEVELOPMENT_ENVIRONMENTS
    if not development and parts.scheme != "https":
        raise OutboundPolicyError(
            "INTEGRATION_TARGET_HTTPS_REQUIRED", "A URL de destino deve usar HTTPS."
        )

    allowed_hosts = bindings.get(credential_ref)
    if (allowed_hosts is not None or not development) and host not in (allowed_hosts or []):
        raise OutboundPolicyError(
            "INTEGRATION_TARGET_NOT_ALLOWED",
            "O host de destino não está vinculado a esta credencial em "
            "INTEGRATION_CREDENTIAL_HOSTS.",
        )

    if development:
        return
    try:
        addresses = resolver(host, port or 443, type=socket.SOCK_STREAM)
    except (OSError, UnicodeError) as exc:
        raise OutboundPolicyError(
            "INTEGRATION_TARGET_UNRESOLVABLE", "Não foi possível resolver o host de destino."
        ) from exc
    resolved = [item[4][0] for item in addresses]
    if not resolved or not all(_is_public(address) for address in resolved):
        raise OutboundPolicyError(
            "INTEGRATION_TARGET_PRIVATE_ADDRESS",
            "O host de destino resolve para um endereço não público.",
        )


def bound_evidence(evidence: dict[str, Any]) -> dict[str, Any]:
    """Limita o tamanho da evidencia remota persistida e devolvida ao cliente."""
    if len(json.dumps(evidence, default=str)) <= MAX_EVIDENCE_BYTES:
        return evidence
    kept = {
        key: value
        for key, value in evidence.items()
        if not isinstance(value, dict | list) and len(str(value)) <= 300
    }
    kept["truncated"] = True
    return kept
