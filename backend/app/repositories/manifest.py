from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.saas import CapabilityManifest


def list_manifests(session: Session, tenant_id: str) -> list[CapabilityManifest]:
    return list(
        session.scalars(
            select(CapabilityManifest)
            .where(CapabilityManifest.tenant_id == tenant_id)
            .order_by(CapabilityManifest.updated_at.desc())
        )
    )


def get_manifest(session: Session, tenant_id: str, product_id: str) -> CapabilityManifest | None:
    return session.scalar(
        select(CapabilityManifest).where(
            CapabilityManifest.tenant_id == tenant_id,
            CapabilityManifest.saas_product_id == product_id,
        )
    )


def upsert_manifest(
    session: Session, tenant_id: str, product_id: str, values: dict
) -> CapabilityManifest:
    manifest = get_manifest(session, tenant_id, product_id)
    if manifest is None:
        manifest = CapabilityManifest(
            tenant_id=tenant_id,
            saas_product_id=product_id,
            **values,
        )
        session.add(manifest)
    else:
        for field, value in values.items():
            setattr(manifest, field, value)
    session.flush()
    session.refresh(manifest)
    return manifest
