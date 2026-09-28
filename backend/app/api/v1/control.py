from typing import Annotated

from app.api.v1.access import role_for, tenant_id
from app.core.errors import error_response
from app.db.session import get_session
from app.models.control import ControlResource
from app.repositories.audit import append_audit
from app.schemas.control import (
    ALLOWED_KINDS,
    ControlResourceCreate,
    ControlResourceResponse,
    ControlResourceUpdate,
)
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/control-resources", tags=["control-resources"])


@router.get("", response_model=list[ControlResourceResponse])
def list_resources(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
    kind: Annotated[str | None, Query(max_length=80)] = None,
):
    statement = select(ControlResource).where(ControlResource.tenant_id == tenant_id(current))
    if kind:
        statement = statement.where(ControlResource.kind == kind)
    return list(session.scalars(statement.order_by(ControlResource.kind, ControlResource.name)))


@router.post("", response_model=ControlResourceResponse, status_code=201)
def create_resource(
    body: ControlResourceCreate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    selected = tenant_id(current)
    if role_for(session, current) != "superadmin":
        return error_response(
            request, 403, "CONTROL_RESOURCE_WRITE_FORBIDDEN", "Ação não autorizada."
        )
    if body.kind not in ALLOWED_KINDS:
        return error_response(
            request, 422, "CONTROL_RESOURCE_KIND_INVALID", "Tipo administrativo não suportado."
        )
    existing = session.scalar(
        select(ControlResource).where(
            ControlResource.tenant_id == selected,
            ControlResource.kind == body.kind,
            ControlResource.key == body.key,
        )
    )
    if existing:
        return error_response(
            request, 409, "CONTROL_RESOURCE_EXISTS", "Já existe um registro com esta chave."
        )
    item = ControlResource(tenant_id=selected, **body.model_dump())
    session.add(item)
    session.flush()
    append_audit(
        session,
        tenant_id=selected,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action=f"control.{body.kind}.create",
        resource_type=body.kind,
        resource_id=item.id,
        correlation_id=request.state.correlation_id,
        after_data={"key": body.key, "name": body.name, "status": body.status},
    )
    session.commit()
    session.refresh(item)
    return item


@router.patch("/{resource_id}", response_model=ControlResourceResponse)
def update_resource(
    resource_id: str,
    body: ControlResourceUpdate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    selected = tenant_id(current)
    if role_for(session, current) != "superadmin":
        return error_response(
            request, 403, "CONTROL_RESOURCE_WRITE_FORBIDDEN", "Ação não autorizada."
        )
    item = session.scalar(
        select(ControlResource).where(
            ControlResource.id == resource_id,
            ControlResource.tenant_id == selected,
        )
    )
    if not item:
        return error_response(
            request, 404, "CONTROL_RESOURCE_NOT_FOUND", "Registro administrativo não encontrado."
        )
    before = {
        "name": item.name,
        "description": item.description,
        "status": item.status,
        "data": item.data,
        "version": item.version,
    }
    changes = body.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(item, field, value)
    item.version += 1
    session.flush()
    append_audit(
        session,
        tenant_id=selected,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action=f"control.{item.kind}.update",
        resource_type=item.kind,
        resource_id=item.id,
        correlation_id=request.state.correlation_id,
        before_data=before,
        after_data={
            "name": item.name,
            "description": item.description,
            "status": item.status,
            "data": item.data,
            "version": item.version,
        },
    )
    session.commit()
    session.refresh(item)
    return item
