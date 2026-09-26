from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import error_response
from app.db.session import get_session
from app.models.identity import User
from app.repositories.identity import get_auth_session, list_active_memberships, revoke_auth_session
from app.schemas.auth import LoginRequest, MembershipResponse, SessionResponse, UserResponse
from app.security.sessions import hash_session_token
from app.services.auth import authenticate
from app.tenancy.context import CurrentSession, get_current_session

router = APIRouter(prefix="/auth", tags=["auth"])
COOKIE_NAME = "central_session"


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
