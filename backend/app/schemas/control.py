from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

ALLOWED_KINDS = {
    "product_module",
    "screen",
    "screen_section",
    "widget",
    "action",
    "screen_configuration",
    "plan",
    "subscription",
    "entitlement",
    "usage_record",
    "cost_record",
    "ai_policy",
    "storage_policy",
    "release",
    "security_review",
    "data_inventory",
    "backup",
    "document",
    "feature_flag",
    "team",
    "department",
    "unit",
    "role",
    "access_exception",
}


class ControlResourceCreate(BaseModel):
    kind: str = Field(min_length=2, max_length=80)
    key: str = Field(pattern=r"^[a-z0-9][a-z0-9_.-]{1,159}$")
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=2000)
    status: str = Field(default="draft", pattern=r"^(draft|active|paused|archived|review)$")
    data: dict[str, Any] = Field(default_factory=dict)


class ControlResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    kind: str
    key: str
    name: str
    description: str
    status: str
    version: int
    data: dict[str, Any]
    created_at: datetime
    updated_at: datetime
