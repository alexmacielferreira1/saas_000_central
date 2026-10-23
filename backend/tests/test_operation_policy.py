# ruff: noqa: F811
import json
import re
from pathlib import Path

import pytest
from app.services.operation_policy import SENSITIVE_ACTION_TERMS, is_sensitive_action

from backend.tests.test_access_api import access_client as access_client_fixture  # noqa: F401

ROOT = Path(__file__).resolve().parents[2]
PREVIOUS_BACKEND_TERMS = {"delete", "remove", "suspend", "reset", "rotate", "revoke", "close"}
PREVIOUS_FRONTEND_TERMS = {
    "delete", "remove", "drop", "purge", "destroy", "suspend", "disable", "revoke", "block",
    "rotate", "reset", "force", "elevate", "downgrade", "grant", "provision", "decommission",
    "migrate",
}  # fmt: skip


def frontend_fallback_terms() -> list[str]:
    source = (ROOT / "frontend/src/lib/adminHelpers.js").read_text(encoding="utf-8")
    match = re.search(r"SENSITIVE_KEYWORDS_FALLBACK\s*=\s*(\[.*?\]);", source, re.S)
    assert match, "fallback list not found in adminHelpers.js"
    return json.loads(re.sub(r",\s*\]", "]", match.group(1)))


def test_backend_list_is_reviewed_union_of_previous_lists():
    assert PREVIOUS_BACKEND_TERMS | PREVIOUS_FRONTEND_TERMS <= set(SENSITIVE_ACTION_TERMS)


def test_frontend_fallback_is_identical_to_backend_list():
    assert frontend_fallback_terms() == list(SENSITIVE_ACTION_TERMS)


@pytest.mark.parametrize(
    "action",
    ["disable tenant X", "Grant admin", "migrate database", "Excluir usuário", "desativar conta"],
)
def test_union_and_portuguese_terms_are_sensitive(action):
    assert is_sensitive_action(action)


def test_harmless_action_is_not_sensitive():
    assert not is_sensitive_action("sync users")


def test_policy_endpoint_exposes_backend_list(access_client_fixture):
    response = access_client_fixture.get("/api/v1/operations/policy")

    assert response.status_code == 200
    assert response.json() == {"sensitive_terms": list(SENSITIVE_ACTION_TERMS)}


@pytest.mark.parametrize("action", ["disable tenant X", "grant admin", "excluir produto"])
def test_operations_flagged_by_ui_require_confirmation(access_client_fixture, action):
    response = access_client_fixture.post(
        "/api/v1/operations", json={"saas": "MediaMind AI", "action": action}
    )

    assert response.status_code == 201
    assert response.json()["status"] == "awaiting_confirmation"
