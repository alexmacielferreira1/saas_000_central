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


class PermissionCreate(BaseModel):
    code: str = Field(min_length=3, max_length=160, pattern=r"^[a-z0-9_.-]+$")
    resource: str = Field(min_length=1, max_length=100)
    action: str = Field(min_length=1, max_length=100)
    scope: str = Field(default="tenant", pattern=r"^(global|tenant|product|own)$")
    description: str = Field(default="", max_length=1000)


class PermissionResponse(PermissionCreate):
    id: str


class ProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str = Field(default="", max_length=1000)
    permissions: list[str] = Field(default_factory=list, max_length=500)


class ProfileResponse(ProfileCreate):
    id: str
    version: int
    is_active: bool
