from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ProductSummary(BaseModel):
    total: int
    connected: int
    degraded: int


class OperationsSummary(BaseModel):
    availability: Literal["available", "unavailable"]
    active: int | None


class IncidentsSummary(BaseModel):
    availability: Literal["available", "unavailable"]
    open: int | None


class HomeSummary(BaseModel):
    products: ProductSummary
    operations: OperationsSummary
    incidents: IncidentsSummary
    generated_at: datetime
