from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.saas import ProductUser


def list_product_users(
    session: Session, tenant_id: str, saas_product_id: str | None = None
) -> list[ProductUser]:
    statement = select(ProductUser).where(ProductUser.tenant_id == tenant_id)
    if saas_product_id:
        statement = statement.where(ProductUser.saas_product_id == saas_product_id)
    return list(session.scalars(statement.order_by(ProductUser.email_normalized)))


def get_product_user_by_email(
    session: Session, tenant_id: str, saas_product_id: str, email: str
) -> ProductUser | None:
    return session.scalar(
        select(ProductUser).where(
            ProductUser.tenant_id == tenant_id,
            ProductUser.saas_product_id == saas_product_id,
            ProductUser.email_normalized == email,
        )
    )


def create_product_user(session: Session, tenant_id: str, values: dict) -> ProductUser:
    user = ProductUser(
        tenant_id=tenant_id,
        email_normalized=values["email"],
        source="central_manual",
        **values,
    )
    session.add(user)
    session.flush()
    return user


def count_product_users(session: Session, tenant_id: str, saas_product_id: str) -> int:
    return int(
        session.scalar(
            select(func.count(ProductUser.id)).where(
                ProductUser.tenant_id == tenant_id,
                ProductUser.saas_product_id == saas_product_id,
            )
        )
        or 0
    )
