from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str


class MembershipResponse(BaseModel):
    tenant_id: str
    tenant_name: str
    role: str


class SessionResponse(BaseModel):
    user: UserResponse
    memberships: list[MembershipResponse]
    selected_tenant_id: str | None
