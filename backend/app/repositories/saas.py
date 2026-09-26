from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.saas import SaasProduct


def list_products(session: Session, tenant_id: str) -> list[SaasProduct]:
    return list(
        session.scalars(
            select(SaasProduct).where(SaasProduct.tenant_id == tenant_id).order_by(SaasProduct.name)
        )
    )


def get_product_by_slug(session: Session, tenant_id: str, slug: str) -> SaasProduct | None:
    return session.scalar(
        select(SaasProduct).where(
            SaasProduct.tenant_id == tenant_id,
            SaasProduct.slug == slug,
        )
    )


def get_product(session: Session, tenant_id: str, product_id: str) -> SaasProduct | None:
    return session.scalar(
        select(SaasProduct).where(
            SaasProduct.tenant_id == tenant_id,
            SaasProduct.id == product_id,
        )
    )


def create_product(session: Session, tenant_id: str, values: dict) -> SaasProduct:
    product = SaasProduct(tenant_id=tenant_id, **values)
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def update_product(session: Session, product: SaasProduct, values: dict) -> SaasProduct:
    for field, value in values.items():
        setattr(product, field, value)
    session.commit()
    session.refresh(product)
    return product


def summarize_products(session: Session, tenant_id: str) -> dict[str, int]:
    total, connected, degraded = session.execute(
        select(
            func.count(SaasProduct.id),
            func.count(SaasProduct.id).filter(SaasProduct.status == "connected"),
            func.count(SaasProduct.id).filter(SaasProduct.health.in_(("degraded", "down"))),
        ).where(SaasProduct.tenant_id == tenant_id)
    ).one()
    return {
        "total": total,
        "connected": connected,
        "degraded": degraded,
    }
