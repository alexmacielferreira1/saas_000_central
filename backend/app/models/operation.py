from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.identity import new_id


class AdminOperation(Base):
    __tablename__ = "admin_operations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    saas: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    product_tenant: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    resource: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    action: Mapped[str] = mapped_column(String(200), nullable=False)
    requested_by: Mapped[str] = mapped_column(String(320), nullable=False)
    reason: Mapped[str] = mapped_column(Text, default="", nullable=False)
    dry_run: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    remote_operation_id: Mapped[str | None] = mapped_column(String(200))
    result: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    failure_code: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
