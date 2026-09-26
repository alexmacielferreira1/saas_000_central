from typing import Annotated

from app.core.errors import error_response
from app.db.session import get_session
from app.models.identity import Membership
from app.repositories.audit import list_audit_logs
from app.schemas.audit import AuditLogResponse
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/audit", tags=["audit"])


def selected_tenant(current: CurrentSession) -> str:
    tenant_id = current.auth_session.selected_tenant_id
    if not tenant_id:
        raise ValueError("authenticated session has no selected tenant")
    return tenant_id


def can_read_audit(session: Session, current: CurrentSession, tenant_id: str) -> bool:
    role = session.scalar(
        select(Membership.role).where(
            Membership.user_id == current.user.id,
            Membership.tenant_id == tenant_id,
            Membership.is_active.is_(True),
        )
    )
    return role in {"superadmin", "admin", "delegated_admin"}


@router.get("", response_model=list[AuditLogResponse])
def index(
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
    q: Annotated[str | None, Query(max_length=200)] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    tenant_id = selected_tenant(current)
    if not can_read_audit(session, current, tenant_id):
        return error_response(request, 403, "AUDIT_READ_FORBIDDEN", "Ação não autorizada.")
    return list_audit_logs(session, tenant_id, query=q, limit=limit)
