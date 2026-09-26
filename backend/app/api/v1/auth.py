from datetime import UTC, datetime
from secrets import compare_digest, token_urlsafe
from typing import Annotated

import httpx
from fastapi import APIRouter, Cookie, Depends, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import error_response
from app.db.session import get_session
from app.models.identity import User
from app.repositories.identity import get_auth_session, get_user_by_email, list_active_memberships, revoke_auth_session
from app.schemas.auth import LoginRequest, MembershipResponse, SessionResponse, UserResponse
from app.security.sessions import hash_session_token
from app.services.auth import AccountNotAllowed, authenticate, create_session_for_user, normalize_email
from app.services.google_oauth import authorization_url, exchange_google_code
from app.tenancy.context import CurrentSession, get_current_session

router = APIRouter(prefix="/auth", tags=["auth"])
COOKIE_NAME = "central_session"
GOOGLE_STATE_COOKIE = "central_google_state"


def payload(session: Session, auth_session) -> SessionResponse:
    user = session.get(User, auth_session.user_id)
    memberships = list_active_memberships(session, user.id)
    return SessionResponse(user=UserResponse(id=user.id, email=user.email, full_name=user.full_name), memberships=[MembershipResponse(tenant_id=m.tenant_id, tenant_name=t.name, role=m.role) for m, t in memberships], selected_tenant_id=auth_session.selected_tenant_id)


def set_cookie(response: Response, token: str, settings) -> None:
    response.set_cookie(COOKIE_NAME, token, httponly=True, secure=settings.session_cookie_secure, samesite="none" if settings.session_cookie_secure else "lax", max_age=settings.session_hours * 3600, path="/")


@router.post("/login", response_model=SessionResponse)
def login(body: LoginRequest, request: Request, response: Response, session: Annotated[Session, Depends(get_session)]):
    settings = get_settings()
    result = authenticate(session, body.email, body.password, session_hours=settings.session_hours, max_attempts=settings.login_max_attempts, lockout_minutes=settings.login_lockout_minutes)
    if result is None:
        return error_response(request, 401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.")
    set_cookie(response, result.token, settings)
    return payload(session, result.auth_session)


@router.get("/session", response_model=SessionResponse)
def current(current: Annotated[CurrentSession, Depends(get_current_session)], session: Annotated[Session, Depends(get_session)]):
    return payload(session, current.auth_session)


@router.post("/logout", status_code=204)
def logout(response: Response, session: Annotated[Session, Depends(get_session)], token: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None):
    if token:
        stored = get_auth_session(session, hash_session_token(token))
        if stored and stored.revoked_at is None: revoke_auth_session(session, stored, datetime.now(UTC))
    settings = get_settings()
    response.delete_cookie(COOKIE_NAME, path="/", secure=settings.session_cookie_secure, samesite="none" if settings.session_cookie_secure else "lax")
    response.status_code = 204


@router.get("/google/start")
def google_start(request: Request):
    settings = get_settings()
    if not settings.google_client_id or not settings.google_client_secret:
        return error_response(request, 503, "GOOGLE_OAUTH_NOT_CONFIGURED", "Login Google ainda não configurado.")
    state = token_urlsafe(32)
    response = RedirectResponse(authorization_url(client_id=settings.google_client_id, redirect_uri=settings.google_redirect_uri, state=state))
    response.set_cookie(GOOGLE_STATE_COOKIE, state, httponly=True, secure=settings.session_cookie_secure, samesite="lax", max_age=600, path="/api/v1/auth/google")
    return response


@router.get("/google/callback")
async def google_callback(session: Annotated[Session, Depends(get_session)], code: str | None = None, state: str | None = None, error: str | None = None, oauth_state: Annotated[str | None, Cookie(alias=GOOGLE_STATE_COOKIE)] = None):
    settings = get_settings()
    def failed(reason: str):
        response = RedirectResponse(f"{settings.frontend_url}/login?google_error={reason}")
        response.delete_cookie(GOOGLE_STATE_COOKIE, path="/api/v1/auth/google")
        return response
    if not oauth_state or not state or not compare_digest(state, oauth_state): return failed("invalid_state")
    if error: return failed("access_denied" if error == "access_denied" else "provider_failed")
    if not settings.google_client_id or not settings.google_client_secret: return failed("not_configured")
    if not code: return failed("provider_failed")
    try:
        profile = await exchange_google_code(code=code, client_id=settings.google_client_id, client_secret=settings.google_client_secret.get_secret_value(), redirect_uri=settings.google_redirect_uri)
    except (httpx.HTTPError, KeyError):
        return failed("provider_failed")
    user = get_user_by_email(session, normalize_email(profile.get("email", "")))
    if not profile.get("email_verified") or user is None or not user.is_active:
        return failed("account_not_allowed")
    try:
        result = create_session_for_user(session, user, session_hours=settings.session_hours)
    except AccountNotAllowed:
        return failed("account_not_allowed")
    response = RedirectResponse(f"{settings.frontend_url}/")
    set_cookie(response, result.token, settings)
    response.delete_cookie(GOOGLE_STATE_COOKIE, path="/api/v1/auth/google")
    return response
