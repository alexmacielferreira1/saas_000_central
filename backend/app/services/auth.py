from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.identity import AuthSession, Membership, Tenant, User
from app.repositories.identity import get_user_by_email, list_active_memberships
from app.security.passwords import hash_password, verify_password
from app.security.sessions import hash_session_token, new_session_token

DUMMY_PASSWORD_HASH = hash_password("central-dummy-password-never-used")


class AccountNotAllowed(Exception):
    pass


@dataclass
class LoginResult:
    user: User
    memberships: list[tuple[Membership, Tenant]]
    token: str
    auth_session: AuthSession


def normalize_email(email: str) -> str:
    return email.strip().casefold()


def create_session_for_user(
    session: Session, user: User, *, session_hours: int, now=None
) -> LoginResult:
    memberships = list_active_memberships(session, user.id)
    if not user.is_active or not memberships:
        raise AccountNotAllowed
    now = now or datetime.now(UTC)
    token = new_session_token()
    auth_session = AuthSession(
        user_id=user.id,
        token_hash=hash_session_token(token),
        selected_tenant_id=memberships[0][0].tenant_id,
        expires_at=now + timedelta(hours=session_hours),
    )
    session.add(auth_session)
    session.commit()
    return LoginResult(user, memberships, token, auth_session)


def authenticate(
    session: Session,
    email: str,
    password: str,
    *,
    session_hours: int,
    max_attempts: int = 5,
    lockout_minutes: int = 15,
    now=None,
) -> LoginResult | None:
    now = now or datetime.now(UTC)
    user = get_user_by_email(session, normalize_email(email))
    valid = verify_password(password, user.password_hash if user else DUMMY_PASSWORD_HASH)
    if user is None:
        return None
    locked_until = user.locked_until
    if locked_until is not None and locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=UTC)
    if locked_until is not None and locked_until > now:
        return None
    if not valid or not user.is_active:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= max_attempts:
            user.locked_until = now + timedelta(minutes=lockout_minutes)
        session.commit()
        return None
    user.failed_login_attempts = 0
    user.locked_until = None
    try:
        return create_session_for_user(session, user, session_hours=session_hours, now=now)
    except AccountNotAllowed:
        return None
