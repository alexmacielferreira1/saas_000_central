from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ManagerCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=320)
    role: str = Field(pattern=r"^(superadmin|delegated_admin|operator|viewer)$")
    password: str = Field(min_length=12, max_length=200)


class ManagerUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    role: str | None = Field(
        default=None, pattern=r"^(superadmin|delegated_admin|operator|viewer)$"
    )
    status: str | None = Field(default=None, pattern=r"^(active|suspended)$")


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


class OrganizationUnitCreate(BaseModel):
    kind: str = Field(pattern=r"^(department|sector|team|unit)$")
    name: str = Field(min_length=2, max_length=160)
    parent_id: str | None = None
    manager_user_id: str | None = None


class OrganizationUnitResponse(OrganizationUnitCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    is_active: bool


class UserAccessAssignmentUpdate(BaseModel):
    profile_id: str | None = None
    organization_unit_id: str | None = None
    job_title: str = Field(default="", max_length=160)
    function_name: str = Field(default="", max_length=160)
    scope: dict[str, Any] = Field(default_factory=dict)
    allow_permissions: list[str] = Field(default_factory=list, max_length=500)
    deny_permissions: list[str] = Field(default_factory=list, max_length=500)


class UserAccessAssignmentResponse(UserAccessAssignmentUpdate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    is_active: bool


class EffectiveProfile(BaseModel):
    id: str
    name: str
    version: int


class EffectiveAccessResponse(BaseModel):
    user_id: str
    membership_role: str
    profile: EffectiveProfile | None
    organization_path: list[str]
    job_title: str
    function_name: str
    scope: dict[str, Any]
    permissions: list[str]
    denied_permissions: list[str]
    sources: list[str]
