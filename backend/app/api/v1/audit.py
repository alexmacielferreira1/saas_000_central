from typing import Annotated

from app.core.errors import error_response
from app.db.session import get_session
from app.repositories.audit import list_audit_logs
from app.schemas.audit import AuditLogResponse
from app.tenancy.context import AUDIT_READ_ROLES, TenantContext, get_tenant_context
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

router = APIRouter(prefix="/audit", tags=["audit"])


def selected_tenant(current: TenantContext) -> str:
    return current.tenant_id


def can_read_audit(session: Session, current: TenantContext, tenant_id: str) -> bool:
    return tenant_id == current.tenant_id and current.role in AUDIT_READ_ROLES


@router.get("", response_model=list[AuditLogResponse])
def index(
    request: Request,
    current: Annotated[TenantContext, Depends(get_tenant_context)],
    session: Annotated[Session, Depends(get_session)],
    q: Annotated[str | None, Query(max_length=200)] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    tenant_id = selected_tenant(current)
    if not can_read_audit(session, current, tenant_id):
        return error_response(request, 403, "AUDIT_READ_FORBIDDEN", "Ação não autorizada.")
    return list_audit_logs(session, tenant_id, query=q, limit=limit)
