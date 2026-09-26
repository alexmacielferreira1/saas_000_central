from typing import Annotated

from app.api.v1.saas import can_write_saas, selected_tenant
from app.core.errors import error_response
from app.db.session import get_session
from app.repositories.audit import append_audit
from app.repositories.product_user import (
    count_product_users,
    create_product_user,
    get_product_user_by_email,
    list_product_users,
)
from app.repositories.saas import get_product
from app.schemas.product_user import ProductUserCreate, ProductUserResponse
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

router = APIRouter(prefix="/product-users", tags=["product-users"])


@router.get("", response_model=list[ProductUserResponse])
def index(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
    saas_product_id: Annotated[str | None, Query(max_length=36)] = None,
):
    tenant_id = selected_tenant(current)
    if saas_product_id and get_product(session, tenant_id, saas_product_id) is None:
        return []
    return list_product_users(session, tenant_id, saas_product_id)


@router.post("", response_model=ProductUserResponse, status_code=201)
def create(
    body: ProductUserCreate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(request, 403, "PRODUCT_USER_WRITE_FORBIDDEN", "Ação não autorizada.")
    product = get_product(session, tenant_id, body.saas_product_id)
    if product is None:
        return error_response(request, 404, "SAAS_NOT_FOUND", "SaaS não encontrado.")
    if get_product_user_by_email(session, tenant_id, product.id, body.email):
        return error_response(
            request,
            409,
            "PRODUCT_USER_EXISTS",
            "Este e-mail já está vinculado ao SaaS.",
        )

    user = create_product_user(session, tenant_id, body.model_dump())
    product.user_count = count_product_users(session, tenant_id, product.id)
    after = {
        "saas_product_id": user.saas_product_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "product_tenant": user.product_tenant,
        "status": user.status,
        "source": user.source,
    }
    append_audit(
        session,
        tenant_id=tenant_id,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="product_user.create",
        resource_type="product_user",
        resource_id=user.id,
        correlation_id=request.state.correlation_id,
        after_data=after,
    )
    session.commit()
    session.refresh(user)
    return user
