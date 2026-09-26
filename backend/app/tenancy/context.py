from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models.identity import AuthSession, User
from app.repositories.identity import get_auth_session
from app.security.sessions import hash_session_token


@dataclass
class CurrentSession:
    user: User
    auth_session: AuthSession


def get_current_session(
    session: Annotated[Session, Depends(get_session)],
    central_session: Annotated[str | None, Cookie()] = None,
) -> CurrentSession:
    if not central_session:
        raise HTTPException(401)
    auth_session = get_auth_session(session, hash_session_token(central_session))
    if auth_session is None or auth_session.revoked_at is not None:
        raise HTTPException(401)
    expires_at = auth_session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= datetime.now(UTC):
        raise HTTPException(401)
    user = session.get(User, auth_session.user_id)
    if user is None or not user.is_active:
        raise HTTPException(401)
    return CurrentSession(user, auth_session)
