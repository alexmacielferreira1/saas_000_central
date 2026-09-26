from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
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


class CapabilityManifest(Base):
    __tablename__ = "capability_manifests"
    __table_args__ = (
        UniqueConstraint("tenant_id", "saas_product_id", name="uq_manifest_tenant_product"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    saas_product_id: Mapped[str] = mapped_column(
        ForeignKey("saas_products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    admin_api_version: Mapped[str | None] = mapped_column(String(50))
    compatibility: Mapped[str] = mapped_column(String(50), default="limited", nullable=False)
    capabilities: Mapped[list[Any]] = mapped_column(JSON, default=list, nullable=False)
    health: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    resources: Mapped[list[Any]] = mapped_column(JSON, default=list, nullable=False)
    scopes: Mapped[list[Any]] = mapped_column(JSON, default=list, nullable=False)
    events: Mapped[list[Any]] = mapped_column(JSON, default=list, nullable=False)
    limits: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class ProductUser(Base):
    __tablename__ = "product_users"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "saas_product_id",
            "email_normalized",
            name="uq_product_user_tenant_product_email",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    saas_product_id: Mapped[str] = mapped_column(
        ForeignKey("saas_products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    external_id: Mapped[str | None] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    email_normalized: Mapped[str] = mapped_column(String(320), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    role: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    product_tenant: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="central_manual", nullable=False)
    last_sync: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class Configuration(Base):
    __tablename__ = "configurations"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id", "scope_key", "environment", "key", name="uq_configuration_scope_key"
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    saas_product_id: Mapped[str | None] = mapped_column(
        ForeignKey("saas_products.id", ondelete="CASCADE"), index=True
    )
    scope_key: Mapped[str] = mapped_column(String(36), nullable=False)
    key: Mapped[str] = mapped_column(String(200), nullable=False)
    value: Mapped[str] = mapped_column(Text, default="", nullable=False)
    previous_value: Mapped[str | None] = mapped_column(Text)
    environment: Mapped[str] = mapped_column(String(50), default="production", nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="setting", nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    author: Mapped[str] = mapped_column(String(320), default="", nullable=False)
    reason: Mapped[str] = mapped_column(Text, default="", nullable=False)
    approval_status: Mapped[str] = mapped_column(String(50), default="auto", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
