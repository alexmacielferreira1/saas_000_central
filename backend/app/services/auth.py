from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import sha256

from sqlalchemy import case, delete, or_, select, update
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from app.models.identity import AuthSession, LoginThrottle, Membership, Tenant, User
from app.repositories.identity import get_user_by_email, list_active_memberships
from app.security.passwords import hash_password, verify_password
from app.security.sessions import hash_session_token, new_session_token

DUMMY_PASSWORD_HASH = hash_password("central-dummy-password-never-used")
ACCOUNT_LOCK_FACTOR = 10
THROTTLE_RESET_AFTER = timedelta(hours=24)
MAX_PAIR_LOCK = timedelta(hours=24)
USERS = User.__table__
THROTTLES = LoginThrottle.__table__


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


def throttle_key(email_normalized: str, client_ip: str | None) -> str:
    return sha256(f"{email_normalized}|{client_ip or 'unknown'}".encode()).hexdigest()


def _aware(value: datetime | None) -> datetime | None:
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def _pair_locked(session: Session, key: str, now: datetime) -> bool:
    locked_until = session.scalar(
        select(THROTTLES.c.locked_until).where(THROTTLES.c.key_hash == key)
    )
    locked_until = _aware(locked_until)
    return locked_until is not None and locked_until > now


def _register_pair_failure(
    session: Session, key: str, now: datetime, max_attempts: int, lockout_minutes: int
) -> None:
    dialect = session.get_bind().dialect.name
    insert = postgresql_insert if dialect == "postgresql" else sqlite_insert
    statement = (
        insert(THROTTLES)
        .values(key_hash=key, failures=1, updated_at=now)
        .on_conflict_do_update(
            index_elements=[THROTTLES.c.key_hash],
            set_={
                "failures": case(
                    (THROTTLES.c.updated_at < now - THROTTLE_RESET_AFTER, 1),
                    else_=THROTTLES.c.failures + 1,
                ),
                "updated_at": now,
            },
        )
        .returning(THROTTLES.c.failures)
    )
    failures = session.execute(statement).scalar_one()
    if failures >= max_attempts and failures % max_attempts == 0:
        level = failures // max_attempts
        duration = min(timedelta(minutes=lockout_minutes) * 2 ** (level - 1), MAX_PAIR_LOCK)
        session.execute(
            update(THROTTLES).where(THROTTLES.c.key_hash == key).values(locked_until=now + duration)
        )
    session.execute(
        delete(THROTTLES).where(
            THROTTLES.c.updated_at < now - THROTTLE_RESET_AFTER,
            or_(THROTTLES.c.locked_until.is_(None), THROTTLES.c.locked_until < now),
        )
    )


def _register_account_failure(
    session: Session, user_id: str, now: datetime, max_attempts: int, lockout_minutes: int
) -> None:
    ceiling = max_attempts * ACCOUNT_LOCK_FACTOR
    failures = session.execute(
        update(USERS)
        .where(USERS.c.id == user_id)
        .values(failed_login_attempts=USERS.c.failed_login_attempts + 1)
        .returning(USERS.c.failed_login_attempts)
    ).scalar_one()
    if failures >= ceiling:
        session.execute(
            update(USERS)
            .where(USERS.c.id == user_id, USERS.c.failed_login_attempts >= ceiling)
            .values(failed_login_attempts=0, locked_until=now + timedelta(minutes=lockout_minutes))
        )


def authenticate(
    session: Session,
    email: str,
    password: str,
    *,
    session_hours: int,
    max_attempts: int = 5,
    lockout_minutes: int = 15,
    now=None,
    client_ip: str | None = None,
) -> LoginResult | None:
    """Autentica com throttling por conta + origem (backoff exponencial).

    Um atacante só bloqueia o próprio par conta/endereço. O bloqueio da conta inteira
    exige ``max_attempts * ACCOUNT_LOCK_FACTOR`` falhas (ataque distribuído) e o
    contador recomeça a cada bloqueio. Os contadores são atualizados atomicamente.
    """
    now = now or datetime.now(UTC)
    email_normalized = normalize_email(email)
    user = get_user_by_email(session, email_normalized)
    valid = verify_password(password, user.password_hash if user else DUMMY_PASSWORD_HASH)
    key = throttle_key(email_normalized, client_ip)
    if _pair_locked(session, key, now):
        return None
    if user is None:
        _register_pair_failure(session, key, now, max_attempts, lockout_minutes)
        session.commit()
        return None
    locked_until = _aware(session.scalar(select(USERS.c.locked_until).where(USERS.c.id == user.id)))
    if locked_until is not None and locked_until > now:
        return None
    if not valid or not user.is_active:
        _register_pair_failure(session, key, now, max_attempts, lockout_minutes)
        _register_account_failure(session, user.id, now, max_attempts, lockout_minutes)
        session.commit()
        return None
    session.execute(
        update(USERS)
        .where(USERS.c.id == user.id)
        .values(failed_login_attempts=0, locked_until=None)
    )
    session.execute(delete(THROTTLES).where(THROTTLES.c.key_hash == key))
    user.failed_login_attempts = 0
    user.locked_until = None
    try:
        return create_session_for_user(session, user, session_hours=session_hours, now=now)
    except AccountNotAllowed:
        return None
