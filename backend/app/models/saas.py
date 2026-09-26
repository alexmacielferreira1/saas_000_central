from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.identity import new_id


class SaasProduct(Base):
    __tablename__ = "saas_products"
    __table_args__ = (UniqueConstraint("tenant_id", "slug", name="uq_saas_tenant_slug"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    base_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    color: Mapped[str] = mapped_column(String(20), default="#6366f1", nullable=False)
    icon: Mapped[str] = mapped_column(String(100), default="Boxes", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="unavailable", nullable=False)
    health: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False)
    compatibility: Mapped[str] = mapped_column(String(50), default="limited", nullable=False)
    integration_level: Mapped[str] = mapped_column(String(50), default="inventory", nullable=False)
    admin_api_version: Mapped[str | None] = mapped_column(String(50))
    last_handshake: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tenant_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    user_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
