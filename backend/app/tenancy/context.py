from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models.identity import AuthSession, Membership, Tenant, User
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


WRITE_ROLES = frozenset({"superadmin", "admin"})
AUDIT_READ_ROLES = frozenset({"superadmin", "admin", "delegated_admin"})


class TenantAccessDenied(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(code)
        self.code = code
        self.message = message


@dataclass
class TenantContext(CurrentSession):
    """Sessao valida + tenant selecionado ativo + membership ativa nesse tenant."""

    tenant: Tenant
    membership: Membership

    @property
    def tenant_id(self) -> str:
        return self.tenant.id

    @property
    def role(self) -> str:
        return self.membership.role


def get_tenant_context(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
) -> TenantContext:
    tenant_id = current.auth_session.selected_tenant_id
    if not tenant_id:
        raise TenantAccessDenied(
            "TENANT_NOT_SELECTED", "Nenhuma organização selecionada para esta sessão."
        )
    row = session.execute(
        select(Membership, Tenant)
        .join(Tenant, Tenant.id == Membership.tenant_id)
        .where(
            Membership.user_id == current.user.id,
            Membership.tenant_id == tenant_id,
            Membership.is_active.is_(True),
            Tenant.is_active.is_(True),
        )
    ).one_or_none()
    if row is None:
        raise TenantAccessDenied(
            "TENANT_ACCESS_FORBIDDEN",
            "Você não possui acesso ativo ao tenant selecionado.",
        )
    membership, tenant = row
    return TenantContext(current.user, current.auth_session, tenant, membership)


def revoke_user_sessions(session: Session, *, user_id: str, tenant_id: str, now=None) -> int:
    """Revoga, na transacao corrente, as sessoes abertas do usuario no tenant."""
    result = session.execute(
        update(AuthSession)
        .where(
            AuthSession.user_id == user_id,
            AuthSession.selected_tenant_id == tenant_id,
            AuthSession.revoked_at.is_(None),
        )
        .values(revoked_at=now or datetime.now(UTC))
    )
    return result.rowcount or 0
