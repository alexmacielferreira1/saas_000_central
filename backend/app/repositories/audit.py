from typing import Any

from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def append_audit(
    session: Session,
    *,
    tenant_id: str,
    actor_user_id: str | None,
    actor_email: str,
    action: str,
    resource_type: str,
    resource_id: str,
    correlation_id: str,
    before_data: dict[str, Any] | None = None,
    after_data: dict[str, Any] | None = None,
    result: str = "success",
    origin: str = "api",
) -> AuditLog:
    event = AuditLog(
        tenant_id=tenant_id,
        actor_user_id=actor_user_id,
        actor_email=actor_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        correlation_id=correlation_id,
        before_data=before_data,
        after_data=after_data,
        result=result,
        origin=origin,
    )
    session.add(event)
    return event


def list_audit_logs(
    session: Session,
    tenant_id: str,
    *,
    query: str | None = None,
    limit: int = 100,
) -> list[AuditLog]:
    statement = select(AuditLog).where(AuditLog.tenant_id == tenant_id)
    if query:
        pattern = f"%{query.strip()}%"
        statement = statement.where(
            or_(
                AuditLog.actor_email.ilike(pattern),
                AuditLog.action.ilike(pattern),
                AuditLog.resource_type.ilike(pattern),
                AuditLog.resource_id.ilike(pattern),
                AuditLog.correlation_id.ilike(pattern),
            )
        )
    return list(session.scalars(statement.order_by(desc(AuditLog.created_at)).limit(limit)))
