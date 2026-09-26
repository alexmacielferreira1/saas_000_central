from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductUserCreate(BaseModel):
    saas_product_id: str = Field(min_length=1, max_length=36)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=320)
    full_name: str = Field(default="", max_length=200)
    role: str = Field(default="", max_length=100)
    product_tenant: str = Field(default="", max_length=200)
    status: str = Field(default="active", pattern=r"^(active|suspended|invited|inactive)$")
    external_id: str | None = Field(default=None, max_length=200)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("full_name", "role", "product_tenant")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class ProductUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    saas_product_id: str
    external_id: str | None
    email: str
    full_name: str
    role: str
    product_tenant: str
    status: str
    source: str
    last_sync: datetime
    created_at: datetime
    updated_at: datetime
