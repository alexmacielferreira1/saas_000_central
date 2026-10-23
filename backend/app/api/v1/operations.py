from typing import Annotated

from app.api.v1.saas import can_write_saas, selected_tenant
from app.core.errors import error_response
from app.db.session import get_session
from app.models.operation import AdminOperation
from app.repositories.audit import append_audit
from app.schemas.operation import (
    OperationCreate,
    OperationPolicyResponse,
    OperationResponse,
    OperationStatusUpdate,
)
from app.services.operation_policy import SENSITIVE_ACTION_TERMS, is_sensitive_action
from app.tenancy.context import TenantContext, get_tenant_context
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/operations", tags=["operations"])


def is_requester(item: AdminOperation, current: TenantContext) -> bool:
    if item.requested_by_user_id is not None:
        return item.requested_by_user_id == current.user.id
    # Operações anteriores à 0013 só guardam o e-mail informado: compara de forma conservadora.
    return item.requested_by.strip().casefold() == current.user.email.strip().casefold()


@router.get("/policy", response_model=OperationPolicyResponse)
def policy(current: Annotated[TenantContext, Depends(get_tenant_context)]):
    return OperationPolicyResponse(sensitive_terms=list(SENSITIVE_ACTION_TERMS))


@router.get("", response_model=list[OperationResponse])
def index(
    current: Annotated[TenantContext, Depends(get_tenant_context)],
    session: Annotated[Session, Depends(get_session)],
    saas: Annotated[str | None, Query(max_length=200)] = None,
):
    statement = select(AdminOperation).where(AdminOperation.tenant_id == selected_tenant(current))
    if saas:
        statement = statement.where(AdminOperation.saas == saas)
    return list(session.scalars(statement.order_by(AdminOperation.created_at.desc()).limit(100)))


@router.post("", response_model=OperationResponse, status_code=201)
def create(
    body: OperationCreate,
    request: Request,
    current: Annotated[TenantContext, Depends(get_tenant_context)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(request, 403, "OPERATION_WRITE_FORBIDDEN", "Ação não autorizada.")
    sensitive = is_sensitive_action(body.action)
    item = AdminOperation(
        tenant_id=tenant_id,
        status="awaiting_confirmation" if sensitive else "queued",
        requested_by=body.requested_by or current.user.email,
        requested_by_user_id=current.user.id,
        **body.model_dump(exclude={"requested_by"}),
    )
    session.add(item)
    session.flush()
    append_audit(
        session,
        tenant_id=tenant_id,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="operation.create",
        resource_type="admin_operation",
        resource_id=item.id,
        correlation_id=request.state.correlation_id,
        after_data={
            "saas": item.saas,
            "action": item.action,
            "resource": item.resource,
            "status": item.status,
            "dry_run": item.dry_run,
        },
    )
    session.commit()
    session.refresh(item)
    return item


@router.patch("/{operation_id}/status", response_model=OperationResponse)
def update_status(
    operation_id: str,
    body: OperationStatusUpdate,
    request: Request,
    current: Annotated[TenantContext, Depends(get_tenant_context)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(request, 403, "OPERATION_WRITE_FORBIDDEN", "Ação não autorizada.")
    item = session.scalar(
        select(AdminOperation).where(
            AdminOperation.id == operation_id, AdminOperation.tenant_id == tenant_id
        )
    )
    if item is None:
        return error_response(request, 404, "OPERATION_NOT_FOUND", "Operação não encontrada.")
    if item.status not in {"draft", "awaiting_confirmation"}:
        return error_response(
            request, 409, "OPERATION_NOT_PENDING", "A operação não aguarda decisão."
        )
    if body.status == "queued" and is_requester(item, current):
        return error_response(
            request,
            403,
            "OPERATION_SELF_APPROVAL_FORBIDDEN",
            "Quem solicitou a operação não pode aprová-la.",
        )
    before = item.status
    item.status = body.status
    if body.reason:
        item.reason = body.reason
    append_audit(
        session,
        tenant_id=tenant_id,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="operation.approve" if body.status == "queued" else "operation.reject",
        resource_type="admin_operation",
        resource_id=item.id,
        correlation_id=request.state.correlation_id,
        before_data={"status": before},
        after_data={"status": item.status, "reason": item.reason},
    )
    session.commit()
    session.refresh(item)
    return item
