from typing import Annotated

from app.core.errors import error_response
from app.db.session import get_session
from app.models.identity import Membership
from app.repositories.saas import (
    create_product,
    get_product,
    get_product_by_slug,
    list_products,
    update_product,
)
from app.schemas.saas import SaasCreate, SaasResponse, SaasUpdate
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/saas", tags=["saas"])


def selected_tenant(current: CurrentSession) -> str:
    tenant_id = current.auth_session.selected_tenant_id
    if not tenant_id:
        raise ValueError("authenticated session has no selected tenant")
    return tenant_id


def can_write_saas(session: Session, current: CurrentSession, tenant_id: str) -> bool:
    role = session.scalar(
        select(Membership.role).where(
            Membership.user_id == current.user.id,
            Membership.tenant_id == tenant_id,
            Membership.is_active.is_(True),
        )
    )
    return role in {"superadmin", "admin"}


@router.get("", response_model=list[SaasResponse])
def index(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    return list_products(session, selected_tenant(current))


@router.post("", response_model=SaasResponse, status_code=201)
def create(
    body: SaasCreate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(request, 403, "SAAS_WRITE_FORBIDDEN", "Ação não autorizada.")
    if get_product_by_slug(session, tenant_id, body.slug):
        return error_response(request, 409, "SAAS_SLUG_EXISTS", "Já existe um SaaS com este slug.")
    return create_product(session, tenant_id, body.model_dump())


@router.get("/{product_id}", response_model=SaasResponse)
def show(
    product_id: str,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    product = get_product(session, selected_tenant(current), product_id)
    if product is None:
        return error_response(request, 404, "SAAS_NOT_FOUND", "SaaS não encontrado.")
    return product


@router.patch("/{product_id}", response_model=SaasResponse)
def update(
    product_id: str,
    body: SaasUpdate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(request, 403, "SAAS_WRITE_FORBIDDEN", "Ação não autorizada.")

    product = get_product(session, tenant_id, product_id)
    if product is None:
        return error_response(request, 404, "SAAS_NOT_FOUND", "SaaS não encontrado.")

    values = body.model_dump(exclude_unset=True)
    requested_slug = values.get("slug")
    existing = get_product_by_slug(session, tenant_id, requested_slug) if requested_slug else None
    if existing is not None and existing.id != product.id:
        return error_response(request, 409, "SAAS_SLUG_EXISTS", "Já existe um SaaS com este slug.")

    return update_product(session, product, values)
