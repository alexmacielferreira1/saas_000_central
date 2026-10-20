import pytest
from app.core.config import Settings
from pydantic import ValidationError


def test_production_rejects_insecure_cookie(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")
    monkeypatch.setenv("FRONTEND_URL", "https://central.example")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_local_api_port_matches_google_callback_port(monkeypatch):
    monkeypatch.delenv("API_PORT", raising=False)
    monkeypatch.delenv("GOOGLE_REDIRECT_URI", raising=False)

    settings = Settings(_env_file=None)

    assert settings.api_port == 8011
    assert f":{settings.api_port}/" in settings.google_redirect_uri
