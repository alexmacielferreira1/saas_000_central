from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ConnectionCreate(BaseModel):
    saas_product_id: str = Field(min_length=1, max_length=36)
    name: str = Field(min_length=1, max_length=200)
    environment: str = Field(pattern=r"^(local|development|staging|production)$")
    base_url: str = Field(pattern=r"^https?://", max_length=500)
    credential_ref: str = Field(pattern=r"^[A-Z][A-Z0-9_]{2,199}$")
    freshness_ttl_seconds: int = Field(default=90, ge=15, le=86400)


class ConnectionProduct(BaseModel):
    id: str
    name: str
    slug: str


class ConnectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    status: str
    product: ConnectionProduct
    environment_id: str
    environment: str
    base_url: str
    freshness_ttl_seconds: int
    credential_ref_hint: str
    created_at: datetime
    updated_at: datetime


class ObservationResponse(BaseModel):
    id: str
    connection_id: str
    environment_id: str
    environment: str
    status: str
    freshness: str
    source: str
    evidence: dict[str, Any]
    latency_ms: int | None
    failure_code: str | None
    observed_at: datetime
