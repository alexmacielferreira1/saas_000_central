import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_production_rejects_insecure_cookie(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")
    monkeypatch.setenv("FRONTEND_URL", "https://central.example")
    with pytest.raises(ValidationError): Settings(_env_file=None)
