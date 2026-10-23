from datetime import UTC, datetime
from typing import Annotated

from app.db.session import get_session
from app.repositories.saas import summarize_products
from app.schemas.home import HomeSummary
from app.tenancy.context import TenantContext, get_tenant_context
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

router = APIRouter(prefix="/home", tags=["home"])


@router.get("/summary", response_model=HomeSummary)
def summary(
    request: Request,
    current: Annotated[TenantContext, Depends(get_tenant_context)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = current.tenant_id
    return HomeSummary(
        products=summarize_products(session, tenant_id),
        operations={"availability": "unavailable", "active": None},
        incidents={"availability": "unavailable", "open": None},
        generated_at=datetime.now(UTC),
    )
