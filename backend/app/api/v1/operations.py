import os
from typing import Annotated

import httpx
from app.api.v1.saas import can_write_saas, selected_tenant
from app.core.errors import error_response
from app.db.session import get_session
from app.models.integration import SaasConnection, SaasEnvironment
from app.models.operation import AdminOperation
from app.models.saas import SaasProduct
from app.repositories.audit import append_audit
from app.schemas.operation import OperationCreate, OperationResponse, OperationStatusUpdate
from app.services.connectors import connector_for
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/operations", tags=["operations"])
SENSITIVE_ACTIONS = ("delete", "remove", "suspend", "reset", "rotate", "revoke", "close")
REMOTE_READ_ACTIONS = {"system.describe", "media.count"}


@router.get("", response_model=list[OperationResponse])
def index(
    current: Annotated[CurrentSession, Depends(get_current_session)],
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
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(request, 403, "OPERATION_WRITE_FORBIDDEN", "Ação não autorizada.")
    sensitive = any(term in body.action.lower() for term in SENSITIVE_ACTIONS)
    item = AdminOperation(
        tenant_id=tenant_id,
        status="awaiting_confirmation" if sensitive else "queued",
        requested_by=body.requested_by or current.user.email,
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
    current: Annotated[CurrentSession, Depends(get_current_session)],
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


@router.post("/{operation_id}/execute", response_model=OperationResponse)
def execute(
    operation_id: str,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(request, 403, "OPERATION_WRITE_FORBIDDEN", "Ação não autorizada.")
    item = session.scalar(
        select(AdminOperation).where(
            AdminOperation.id == operation_id,
            AdminOperation.tenant_id == tenant_id,
        )
    )
    if item is None:
        return error_response(request, 404, "OPERATION_NOT_FOUND", "Operação não encontrada.")
    if not item.dry_run or item.action not in REMOTE_READ_ACTIONS:
        return error_response(
            request,
            409,
            "OPERATION_REMOTE_ACTION_NOT_ALLOWED",
            "Somente operações de leitura em simulação estão liberadas.",
        )

    row = session.execute(
        select(SaasProduct, SaasConnection, SaasEnvironment)
        .join(SaasConnection, SaasConnection.saas_product_id == SaasProduct.id)
        .join(SaasEnvironment, SaasEnvironment.connection_id == SaasConnection.id)
        .where(
            SaasProduct.tenant_id == tenant_id,
            SaasConnection.tenant_id == tenant_id,
            SaasEnvironment.tenant_id == tenant_id,
            SaasProduct.slug == item.saas,
            SaasEnvironment.enabled.is_(True),
        )
    ).first()
    if row is None:
        return error_response(
            request,
            409,
            "OPERATION_CONNECTION_UNAVAILABLE",
            "Não existe conexão ativa para este SaaS.",
        )
    product, connection, environment = row
    token = os.getenv(connection.credential_ref)
    if not token:
        return error_response(
            request,
            409,
            "OPERATION_CREDENTIAL_UNAVAILABLE",
            "A credencial da conexão não está configurada.",
        )

    connector = connector_for(product.slug, environment.base_url, token)
    try:
        if item.remote_operation_id:
            remote = connector.get_operation_status(item.remote_operation_id)
        else:
            remote = connector.execute_operation(item.action, {}, item.id)
            item.remote_operation_id = str(remote["id"])
    except httpx.TimeoutException:
        item.status = "failed"
        item.failure_code = "REMOTE_TIMEOUT"
        append_audit(
            session,
            tenant_id=tenant_id,
            actor_user_id=current.user.id,
            actor_email=current.user.email,
            action="operation.execute.failed",
            resource_type="admin_operation",
            resource_id=item.id,
            correlation_id=request.state.correlation_id,
            after_data={"status": item.status, "failure_code": item.failure_code},
        )
        session.commit()
        return error_response(
            request,
            502,
            "OPERATION_REMOTE_TIMEOUT",
            "O SaaS não respondeu dentro do tempo limite.",
            retryable=True,
        )
    except httpx.HTTPError:
        item.status = "failed"
        item.failure_code = "REMOTE_UNAVAILABLE"
        append_audit(
            session,
            tenant_id=tenant_id,
            actor_user_id=current.user.id,
            actor_email=current.user.email,
            action="operation.execute.failed",
            resource_type="admin_operation",
            resource_id=item.id,
            correlation_id=request.state.correlation_id,
            after_data={"status": item.status, "failure_code": item.failure_code},
        )
        session.commit()
        return error_response(
            request,
            502,
            "OPERATION_REMOTE_UNAVAILABLE",
            "O SaaS não está disponível para executar a operação.",
            retryable=True,
        )
    item.status = str(remote.get("status", "failed"))
    item.result = remote.get("result") or {}
    item.failure_code = remote.get("failure_code")
    append_audit(
        session,
        tenant_id=tenant_id,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="operation.execute",
        resource_type="admin_operation",
        resource_id=item.id,
        correlation_id=request.state.correlation_id,
        after_data={
            "status": item.status,
            "remote_operation_id": item.remote_operation_id,
            "failure_code": item.failure_code,
        },
    )
    session.commit()
    session.refresh(item)
    return item
