from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OperationCreate(BaseModel):
    saas: str = Field(min_length=1, max_length=200)
    product_tenant: str = Field(default="", max_length=200)
    resource: str = Field(default="", max_length=300)
    action: str = Field(min_length=1, max_length=200)
    requested_by: str = Field(default="", max_length=320)
    reason: str = Field(default="", max_length=2000)
    dry_run: bool = False


class OperationStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(queued|cancelled)$")
    reason: str = Field(default="", max_length=2000)


class OperationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    saas: str
    product_tenant: str
    resource: str
    action: str
    requested_by: str
    reason: str
    dry_run: bool
    status: str
    retry_count: int
    created_at: datetime
    updated_at: datetime
