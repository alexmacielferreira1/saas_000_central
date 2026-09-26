from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ConfigurationCreate(BaseModel):
    saas_product_id: str | None = Field(default=None, max_length=36)
    key: str = Field(min_length=1, max_length=200, pattern=r"^[A-Za-z0-9_.-]+$")
    value: str = Field(default="", max_length=10000)
    environment: str = Field(
        default="production", pattern=r"^(local|development|test|staging|production)$"
    )
    type: str = Field(default="setting", pattern=r"^(setting|feature_flag|limit)$")
    enabled: bool = True
    author: str = Field(default="", max_length=320)
    reason: str = Field(default="", max_length=2000)
    approval_status: str = Field(default="auto", pattern=r"^(auto|pending|approved|rejected)$")

    @field_validator("key")
    @classmethod
    def normalize_key(cls, value):
        return value.strip()


class ConfigurationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    saas_product_id: str | None
    scope_key: str
    key: str
    value: str
    previous_value: str | None
    environment: str
    type: str
    enabled: bool
    author: str
    reason: str
    approval_status: str
    created_at: datetime
    updated_at: datetime
