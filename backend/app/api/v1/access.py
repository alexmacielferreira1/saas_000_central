from typing import Annotated

from app.core.errors import error_response
from app.db.session import get_session
from app.models.identity import AccessProfile, Membership, PermissionDefinition, User
from app.repositories.audit import append_audit
from app.repositories.identity import get_user_by_email
from app.schemas.access import (
    ManagerCreate,
    ManagerResponse,
    PermissionCreate,
    PermissionResponse,
    ProfileCreate,
    ProfileResponse,
)
from app.security.passwords import hash_password
from app.services.auth import normalize_email
from app.tenancy.context import CurrentSession, get_current_session
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(prefix="/access", tags=["access"])


def tenant_id(current: CurrentSession) -> str:
    selected = current.auth_session.selected_tenant_id
    if not selected:
        raise ValueError("authenticated session has no selected tenant")
    return selected


def role_for(session: Session, current: CurrentSession) -> str | None:
    return session.scalar(
        select(Membership.role).where(
            Membership.user_id == current.user.id,
            Membership.tenant_id == tenant_id(current),
            Membership.is_active.is_(True),
        )
    )


def response_for(user: User, membership: Membership) -> ManagerResponse:
    return ManagerResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=membership.role,
        status="active" if user.is_active and membership.is_active else "suspended",
    )


@router.get("/managers", response_model=list[ManagerResponse])
def managers(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    rows = session.execute(
        select(User, Membership)
        .join(Membership, Membership.user_id == User.id)
        .where(Membership.tenant_id == tenant_id(current))
        .order_by(User.email_normalized)
    ).all()
    return [response_for(user, membership) for user, membership in rows]


@router.post("/managers", response_model=ManagerResponse, status_code=201)
def create_manager(
    body: ManagerCreate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    if role_for(session, current) != "superadmin":
        return error_response(request, 403, "MANAGER_WRITE_FORBIDDEN", "Ação não autorizada.")
    email = normalize_email(body.email)
    if get_user_by_email(session, email):
        return error_response(request, 409, "USER_EMAIL_EXISTS", "E-mail já cadastrado.")
    user = User(
        email=email,
        email_normalized=email,
        full_name=body.full_name.strip(),
        password_hash=hash_password(body.password),
    )
    session.add(user)
    session.flush()
    membership = Membership(user_id=user.id, tenant_id=tenant_id(current), role=body.role)
    session.add(membership)
    session.commit()
    return response_for(user, membership)


@router.get("/permissions", response_model=list[PermissionResponse])
def permissions(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    return list(
        session.scalars(
            select(PermissionDefinition)
            .where(PermissionDefinition.tenant_id == tenant_id(current))
            .order_by(PermissionDefinition.code)
        )
    )


@router.post("/permissions", response_model=PermissionResponse, status_code=201)
def create_permission(
    body: PermissionCreate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    selected = tenant_id(current)
    if role_for(session, current) != "superadmin":
        return error_response(request, 403, "PERMISSION_WRITE_FORBIDDEN", "Ação não autorizada.")
    if session.scalar(
        select(PermissionDefinition).where(
            PermissionDefinition.tenant_id == selected, PermissionDefinition.code == body.code
        )
    ):
        return error_response(request, 409, "PERMISSION_EXISTS", "Permissão já cadastrada.")
    item = PermissionDefinition(tenant_id=selected, **body.model_dump())
    session.add(item)
    session.flush()
    append_audit(
        session,
        tenant_id=selected,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="permission.create",
        resource_type="permission",
        resource_id=item.id,
        correlation_id=request.state.correlation_id,
        after_data=body.model_dump(),
    )
    session.commit()
    return item


@router.get("/profiles", response_model=list[ProfileResponse])
def profiles(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    return list(
        session.scalars(
            select(AccessProfile)
            .where(AccessProfile.tenant_id == tenant_id(current))
            .order_by(AccessProfile.name)
        )
    )


@router.post("/profiles", response_model=ProfileResponse, status_code=201)
def create_profile(
    body: ProfileCreate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    selected = tenant_id(current)
    if role_for(session, current) != "superadmin":
        return error_response(request, 403, "PROFILE_WRITE_FORBIDDEN", "Ação não autorizada.")
    known = set(
        session.scalars(
            select(PermissionDefinition.code).where(PermissionDefinition.tenant_id == selected)
        )
    )
    unknown = sorted(set(body.permissions) - known)
    if unknown:
        return error_response(
            request,
            422,
            "UNKNOWN_PERMISSION",
            f"Permissões não cadastradas: {', '.join(unknown)}.",
        )
    item = AccessProfile(tenant_id=selected, **body.model_dump())
    session.add(item)
    session.flush()
    append_audit(
        session,
        tenant_id=selected,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="profile.create",
        resource_type="access_profile",
        resource_id=item.id,
        correlation_id=request.state.correlation_id,
        after_data=body.model_dump(),
    )
    session.commit()
    return item
