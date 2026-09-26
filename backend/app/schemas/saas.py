from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SaasCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=100)
    description: str = Field(default="", max_length=5000)
    version: str = Field(default="1.0.0", max_length=50)
    base_url: str = Field(default="", max_length=500)
    color: str = Field(default="#6366f1", pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: str = Field(default="Boxes", max_length=100)
    status: str = Field(default="unavailable", max_length=50)
    health: str = Field(default="unknown", max_length=50)
    compatibility: str = Field(default="limited", max_length=50)
    integration_level: str = Field(default="inventory", max_length=50)


class SaasUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(
        default=None,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        max_length=100,
    )
    description: str | None = Field(default=None, max_length=5000)
    version: str | None = Field(default=None, max_length=50)
    base_url: str | None = Field(default=None, max_length=500)
    color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: str | None = Field(default=None, max_length=100)
    status: str | None = Field(default=None, max_length=50)
    health: str | None = Field(default=None, max_length=50)
    compatibility: str | None = Field(default=None, max_length=50)
    integration_level: str | None = Field(default=None, max_length=50)

    @model_validator(mode="before")
    @classmethod
    def reject_explicit_nulls(cls, values):
        if isinstance(values, dict) and any(value is None for value in values.values()):
            raise ValueError("Campos enviados para atualização não podem ser nulos.")
        return values


class SaasResponse(SaasCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    admin_api_version: str | None
    last_handshake: datetime | None
    tenant_count: int
    user_count: int
    created_at: datetime
    updated_at: datetime
