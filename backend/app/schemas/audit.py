from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    actor_user_id: str | None
    actor_email: str
    action: str
    resource_type: str
    resource_id: str
    result: str
    origin: str
    correlation_id: str
    before_data: dict[str, Any] | None
    after_data: dict[str, Any] | None
    created_at: datetime
