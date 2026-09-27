from datetime import UTC, datetime, timedelta
from typing import Annotated

from app.api.v1.saas import can_write_saas, selected_tenant
from app.core.errors import error_response
from app.db.session import get_session
from app.models.integration import IntegrationObservation, SaasConnection, SaasEnvironment
from app.models.saas import SaasProduct
from app.repositories.audit import append_audit
from app.repositories.saas import get_product
from app.schemas.integration import (
    ConnectionCreate,
    ConnectionProduct,
    ConnectionResponse,
    ObservationResponse,
)
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/integrations", tags=["integrations"])
DbSession = Annotated[Session, Depends(get_session)]
Authenticated = Annotated[CurrentSession, Depends(get_current_session)]


def mask_credential_ref(value: str) -> str:
    if len(value) <= 8:
        return f"{value[:2]}••••{value[-2:]}"
    return f"{value[:4]}••••{value[-4:]}"


def aware_utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def classify_observation(observed_at: datetime, ttl_seconds: int, now: datetime) -> str:
    observed = aware_utc(observed_at)
    reference = aware_utc(now)
    return "confirmed" if reference - observed <= timedelta(seconds=ttl_seconds) else "stale"


def serialize_connection(
    connection: SaasConnection,
    environment: SaasEnvironment,
    product: SaasProduct,
) -> ConnectionResponse:
    return ConnectionResponse(
        id=connection.id,
        name=connection.name,
        status=connection.status,
        product=ConnectionProduct(id=product.id, name=product.name, slug=product.slug),
        environment_id=environment.id,
        environment=environment.name,
        base_url=environment.base_url,
        freshness_ttl_seconds=environment.freshness_ttl_seconds,
        credential_ref_hint=mask_credential_ref(connection.credential_ref),
        created_at=aware_utc(connection.created_at),
        updated_at=aware_utc(connection.updated_at),
    )


@router.get("/connections", response_model=list[ConnectionResponse])
def list_connections(current: Authenticated, session: DbSession):
    tenant_id = selected_tenant(current)
    rows = session.execute(
        select(SaasConnection, SaasEnvironment, SaasProduct)
        .join(SaasEnvironment, SaasEnvironment.connection_id == SaasConnection.id)
        .join(SaasProduct, SaasProduct.id == SaasConnection.saas_product_id)
        .where(
            SaasConnection.tenant_id == tenant_id,
            SaasEnvironment.tenant_id == tenant_id,
            SaasProduct.tenant_id == tenant_id,
        )
        .order_by(SaasProduct.name, SaasEnvironment.name)
    ).all()
    return [
        serialize_connection(connection, environment, product)
        for connection, environment, product in rows
    ]


@router.post("/connections", response_model=ConnectionResponse, status_code=201)
def create_connection(
    body: ConnectionCreate,
    request: Request,
    current: Authenticated,
    session: DbSession,
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(
            request,
            403,
            "INTEGRATION_WRITE_FORBIDDEN",
            "Seu perfil não pode configurar integrações.",
        )
    product = get_product(session, tenant_id, body.saas_product_id)
    if product is None:
        return error_response(request, 404, "SAAS_NOT_FOUND", "SaaS não encontrado.")
    existing = session.scalar(
        select(SaasConnection).where(
            SaasConnection.tenant_id == tenant_id,
            SaasConnection.saas_product_id == product.id,
        )
    )
    if existing is not None:
        return error_response(
            request,
            409,
            "INTEGRATION_ALREADY_EXISTS",
            "Este SaaS já possui uma conexão administrativa.",
        )

    connection = SaasConnection(
        tenant_id=tenant_id,
        saas_product_id=product.id,
        name=body.name,
        credential_ref=body.credential_ref,
    )
    session.add(connection)
    session.flush()
    environment = SaasEnvironment(
        tenant_id=tenant_id,
        connection_id=connection.id,
        name=body.environment,
        base_url=body.base_url.rstrip("/"),
        freshness_ttl_seconds=body.freshness_ttl_seconds,
    )
    session.add(environment)
    session.flush()
    append_audit(
        session,
        tenant_id=tenant_id,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="integration.connection.create",
        resource_type="saas_connection",
        resource_id=connection.id,
        correlation_id=request.state.correlation_id,
        after_data={
            "saas_product_id": product.id,
            "environment": environment.name,
            "base_url": environment.base_url,
            "status": connection.status,
        },
    )
    session.commit()
    session.refresh(connection)
    session.refresh(environment)
    return serialize_connection(connection, environment, product)


@router.get("/observations", response_model=list[ObservationResponse])
def list_observations(
    current: Authenticated,
    session: DbSession,
    connection_id: Annotated[str | None, Query(max_length=36)] = None,
):
    tenant_id = selected_tenant(current)
    statement = (
        select(IntegrationObservation, SaasEnvironment)
        .join(SaasEnvironment, SaasEnvironment.id == IntegrationObservation.environment_id)
        .where(
            IntegrationObservation.tenant_id == tenant_id,
            SaasEnvironment.tenant_id == tenant_id,
        )
    )
    if connection_id:
        statement = statement.where(IntegrationObservation.connection_id == connection_id)
    rows = session.execute(statement.order_by(IntegrationObservation.observed_at.desc())).all()
    now = datetime.now(UTC)
    return [
        ObservationResponse(
            id=observation.id,
            connection_id=observation.connection_id,
            environment_id=observation.environment_id,
            environment=environment.name,
            status=observation.status,
            freshness=classify_observation(
                observation.observed_at,
                environment.freshness_ttl_seconds,
                now,
            ),
            source=observation.source,
            evidence=observation.evidence,
            latency_ms=observation.latency_ms,
            failure_code=observation.failure_code,
            observed_at=aware_utc(observation.observed_at),
        )
        for observation, environment in rows
    ]
