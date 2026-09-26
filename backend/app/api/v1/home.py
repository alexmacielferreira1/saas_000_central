from datetime import UTC, datetime
from typing import Annotated

from app.core.errors import error_response
from app.db.session import get_session
from app.models.identity import Membership
from app.repositories.saas import summarize_products
from app.schemas.home import HomeSummary
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/summary", response_model=HomeSummary)
def summary(
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = current.auth_session.selected_tenant_id
    membership = session.scalar(
        select(Membership).where(
            Membership.user_id == current.user.id,
            Membership.tenant_id == tenant_id,
            Membership.is_active.is_(True),
        )
    )
    if membership is None:
        return error_response(
            request,
            403,
            "TENANT_ACCESS_FORBIDDEN",
            "Você não possui acesso ativo ao tenant selecionado.",
        )

    return HomeSummary(
        products=summarize_products(session, tenant_id),
        operations={"availability": "unavailable", "active": None},
        incidents={"availability": "unavailable", "open": None},
        generated_at=datetime.now(UTC),
    )
