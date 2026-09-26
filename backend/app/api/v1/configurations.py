from typing import Annotated

from app.api.v1.saas import can_write_saas, selected_tenant
from app.core.errors import error_response
from app.db.session import get_session
from app.models.saas import Configuration
from app.repositories.audit import append_audit
from app.repositories.saas import get_product
from app.schemas.configuration import ConfigurationCreate, ConfigurationResponse
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/configurations", tags=["configurations"])


@router.get("", response_model=list[ConfigurationResponse])
def index(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
    saas_product_id: Annotated[str | None, Query(max_length=36)] = None,
):
    statement = select(Configuration).where(Configuration.tenant_id == selected_tenant(current))
    if saas_product_id:
        statement = statement.where(Configuration.saas_product_id == saas_product_id)
    return list(session.scalars(statement.order_by(Configuration.key)))


@router.post("", response_model=ConfigurationResponse, status_code=201)
def create(
    body: ConfigurationCreate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(request, 403, "CONFIGURATION_WRITE_FORBIDDEN", "Ação não autorizada.")
    if body.saas_product_id and get_product(session, tenant_id, body.saas_product_id) is None:
        return error_response(request, 404, "SAAS_NOT_FOUND", "SaaS não encontrado.")
    scope_key = body.saas_product_id or "central"
    existing = session.scalar(
        select(Configuration).where(
            Configuration.tenant_id == tenant_id,
            Configuration.scope_key == scope_key,
            Configuration.environment == body.environment,
            Configuration.key == body.key,
        )
    )
    if existing:
        return error_response(
            request,
            409,
            "CONFIGURATION_EXISTS",
            "A configuração já existe neste escopo e ambiente.",
        )
    config = Configuration(
        tenant_id=tenant_id,
        scope_key=scope_key,
        author=body.author or current.user.email,
        **body.model_dump(exclude={"author"}),
    )
    session.add(config)
    session.flush()
    after = {
        "scope_key": scope_key,
        "key": config.key,
        "value": config.value,
        "environment": config.environment,
        "type": config.type,
        "enabled": config.enabled,
        "approval_status": config.approval_status,
        "reason": config.reason,
    }
    append_audit(
        session,
        tenant_id=tenant_id,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="configuration.create",
        resource_type="configuration",
        resource_id=config.id,
        correlation_id=request.state.correlation_id,
        after_data=after,
    )
    session.commit()
    session.refresh(config)
    return config
