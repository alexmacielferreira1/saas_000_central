from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CapabilityManifestUpsert(BaseModel):
    version: str = Field(default="1.0.0", min_length=1, max_length=50)
    admin_api_version: str | None = Field(default=None, max_length=50)
    compatibility: str = Field(default="limited", min_length=1, max_length=50)
    capabilities: list[Any] = Field(default_factory=list)
    health: dict[str, Any] = Field(default_factory=dict)
    resources: list[Any] = Field(default_factory=list)
    scopes: list[Any] = Field(default_factory=list)
    events: list[Any] = Field(default_factory=list)
    limits: dict[str, Any] = Field(default_factory=dict)


class CapabilityManifestResponse(CapabilityManifestUpsert):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    saas_product_id: str
    created_at: datetime
    updated_at: datetime
