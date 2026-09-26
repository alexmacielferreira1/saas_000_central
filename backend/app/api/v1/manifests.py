from typing import Annotated, Any

from app.api.v1.saas import can_write_saas, selected_tenant
from app.core.errors import error_response
from app.db.session import get_session
from app.repositories.audit import append_audit
from app.repositories.manifest import get_manifest, list_manifests, upsert_manifest
from app.repositories.saas import get_product
from app.schemas.manifest import CapabilityManifestResponse, CapabilityManifestUpsert
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

router = APIRouter(prefix="/manifests", tags=["manifests"])

AUDITABLE_FIELDS = (
    "version",
    "admin_api_version",
    "compatibility",
    "capabilities",
    "health",
    "resources",
    "scopes",
    "events",
    "limits",
)


def snapshot(manifest) -> dict[str, Any]:
    return {field: getattr(manifest, field) for field in AUDITABLE_FIELDS}


@router.get("", response_model=list[CapabilityManifestResponse])
def index(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    return list_manifests(session, selected_tenant(current))


@router.get("/{product_id}", response_model=CapabilityManifestResponse)
def show(
    product_id: str,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    manifest = get_manifest(session, selected_tenant(current), product_id)
    if manifest is None:
        return error_response(
            request, 404, "MANIFEST_NOT_FOUND", "Manifesto de capacidades não encontrado."
        )
    return manifest


@router.put("/{product_id}", response_model=CapabilityManifestResponse)
def upsert(
    product_id: str,
    body: CapabilityManifestUpsert,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    tenant_id = selected_tenant(current)
    if not can_write_saas(session, current, tenant_id):
        return error_response(request, 403, "MANIFEST_WRITE_FORBIDDEN", "Ação não autorizada.")
    if get_product(session, tenant_id, product_id) is None:
        return error_response(request, 404, "SAAS_NOT_FOUND", "SaaS não encontrado.")

    existing = get_manifest(session, tenant_id, product_id)
    before = snapshot(existing) if existing else None
    manifest = upsert_manifest(session, tenant_id, product_id, body.model_dump())
    append_audit(
        session,
        tenant_id=tenant_id,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="manifest.upsert",
        resource_type="capability_manifest",
        resource_id=manifest.id,
        correlation_id=request.state.correlation_id,
        before_data=before,
        after_data=snapshot(manifest),
    )
    session.commit()
    session.refresh(manifest)
    return manifest
