from pydantic import BaseModel, Field


class ManagerCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=320)
    role: str = Field(pattern=r"^(superadmin|delegated_admin|operator|viewer)$")
    password: str = Field(min_length=12, max_length=200)


class ManagerResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    scope_saas: str = "*"
    status: str
    two_factor_enabled: bool = False
