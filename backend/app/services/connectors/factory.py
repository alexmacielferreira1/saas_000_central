import re

from app.services.connectors.hub import HubConnector
from app.services.connectors.mediamind import MediaMindConnector

# Only dedicated connector tokens may be read from the environment; any other variable
# (database URL, OAuth secrets, bootstrap password) must never be sent to a remote SaaS.
CREDENTIAL_REF_PATTERN = r"^[A-Z][A-Z0-9_]{0,180}_HUB(_ADMIN)?_TOKEN$"
_CREDENTIAL_REF = re.compile(CREDENTIAL_REF_PATTERN)

PRODUCT_CONNECTORS = {"mediamind-ai": MediaMindConnector}


def is_allowed_credential_ref(value: str) -> bool:
    return bool(_CREDENTIAL_REF.fullmatch(value or ""))


def connector_for(product_slug: str, base_url: str, token: str):
    return PRODUCT_CONNECTORS.get(product_slug, HubConnector)(base_url, token)
