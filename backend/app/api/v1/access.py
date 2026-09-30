from typing import Annotated

from app.core.errors import error_response
from app.db.session import get_session
from app.models.identity import (
    AccessProfile,
    Membership,
    OrganizationUnit,
    PermissionDefinition,
    User,
    UserAccessAssignment,
)
from app.repositories.audit import append_audit
from app.repositories.identity import get_user_by_email
from app.schemas.access import (
    EffectiveAccessResponse,
    EffectiveProfile,
    ManagerCreate,
    ManagerResponse,
    ManagerUpdate,
    OrganizationUnitCreate,
    OrganizationUnitResponse,
    PermissionCreate,
    PermissionResponse,
    ProfileCreate,
    ProfileResponse,
    UserAccessAssignmentResponse,
    UserAccessAssignmentUpdate,
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


@router.patch("/managers/{user_id}", response_model=ManagerResponse)
def update_manager(
    user_id: str,
    body: ManagerUpdate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    selected = tenant_id(current)
    if role_for(session, current) != "superadmin":
        return error_response(request, 403, "MANAGER_WRITE_FORBIDDEN", "Ação não autorizada.")
    row = session.execute(
        select(User, Membership)
        .join(Membership, Membership.user_id == User.id)
        .where(Membership.tenant_id == selected, User.id == user_id)
    ).one_or_none()
    if row is None:
        return error_response(request, 404, "MANAGER_NOT_FOUND", "Usuário não encontrado.")
    user, membership = row
    changes = body.model_dump(exclude_unset=True)
    before = response_for(user, membership).model_dump()
    if "full_name" in changes:
        user.full_name = changes["full_name"].strip()
    if "role" in changes:
        membership.role = changes["role"]
    if "status" in changes:
        if user.id == current.user.id and changes["status"] == "suspended":
            return error_response(
                request,
                422,
                "SELF_SUSPENSION_FORBIDDEN",
                "Não é possível suspender a própria conta.",
            )
        membership.is_active = changes["status"] == "active"
    session.flush()
    after = response_for(user, membership)
    append_audit(
        session,
        tenant_id=selected,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="manager.update",
        resource_type="manager",
        resource_id=user.id,
        correlation_id=request.state.correlation_id,
        before_data=before,
        after_data=after.model_dump(),
    )
    session.commit()
    return after


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


@router.get("/organization-units", response_model=list[OrganizationUnitResponse])
def organization_units(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    return list(
        session.scalars(
            select(OrganizationUnit)
            .where(OrganizationUnit.tenant_id == tenant_id(current))
            .order_by(OrganizationUnit.kind, OrganizationUnit.name)
        )
    )


@router.post("/organization-units", response_model=OrganizationUnitResponse, status_code=201)
def create_organization_unit(
    body: OrganizationUnitCreate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    selected = tenant_id(current)
    if role_for(session, current) != "superadmin":
        return error_response(request, 403, "ORGANIZATION_WRITE_FORBIDDEN", "Ação não autorizada.")
    if body.parent_id and not session.scalar(
        select(OrganizationUnit).where(
            OrganizationUnit.id == body.parent_id,
            OrganizationUnit.tenant_id == selected,
        )
    ):
        return error_response(
            request, 422, "ORGANIZATION_PARENT_INVALID", "Estrutura superior não encontrada."
        )
    if body.manager_user_id and not session.scalar(
        select(Membership).where(
            Membership.user_id == body.manager_user_id,
            Membership.tenant_id == selected,
            Membership.is_active.is_(True),
        )
    ):
        return error_response(
            request, 422, "ORGANIZATION_MANAGER_INVALID", "Gestor não pertence à organização."
        )
    item = OrganizationUnit(tenant_id=selected, **body.model_dump())
    session.add(item)
    session.flush()
    append_audit(
        session,
        tenant_id=selected,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="organization_unit.create",
        resource_type="organization_unit",
        resource_id=item.id,
        correlation_id=request.state.correlation_id,
        after_data=body.model_dump(),
    )
    session.commit()
    session.refresh(item)
    return item


@router.get("/assignments", response_model=list[UserAccessAssignmentResponse])
def assignments(
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    return list(
        session.scalars(
            select(UserAccessAssignment)
            .where(UserAccessAssignment.tenant_id == tenant_id(current))
            .order_by(UserAccessAssignment.user_id)
        )
    )


@router.put("/users/{user_id}/assignment", response_model=UserAccessAssignmentResponse)
def assign_user_access(
    user_id: str,
    body: UserAccessAssignmentUpdate,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    selected = tenant_id(current)
    if role_for(session, current) != "superadmin":
        return error_response(request, 403, "ASSIGNMENT_WRITE_FORBIDDEN", "Ação não autorizada.")
    if not session.scalar(
        select(Membership).where(
            Membership.user_id == user_id,
            Membership.tenant_id == selected,
        )
    ):
        return error_response(request, 404, "ASSIGNMENT_USER_NOT_FOUND", "Usuário não encontrado.")
    if body.profile_id and not session.scalar(
        select(AccessProfile).where(
            AccessProfile.id == body.profile_id,
            AccessProfile.tenant_id == selected,
            AccessProfile.is_active.is_(True),
        )
    ):
        return error_response(request, 422, "ASSIGNMENT_PROFILE_INVALID", "Perfil inválido.")
    if body.organization_unit_id and not session.scalar(
        select(OrganizationUnit).where(
            OrganizationUnit.id == body.organization_unit_id,
            OrganizationUnit.tenant_id == selected,
            OrganizationUnit.is_active.is_(True),
        )
    ):
        return error_response(request, 422, "ASSIGNMENT_UNIT_INVALID", "Estrutura inválida.")
    item = session.scalar(
        select(UserAccessAssignment).where(
            UserAccessAssignment.tenant_id == selected,
            UserAccessAssignment.user_id == user_id,
        )
    )
    before = None
    if item:
        before = {
            "profile_id": item.profile_id,
            "organization_unit_id": item.organization_unit_id,
            "scope": item.scope,
            "allow_permissions": item.allow_permissions,
            "deny_permissions": item.deny_permissions,
        }
    else:
        item = UserAccessAssignment(tenant_id=selected, user_id=user_id)
        session.add(item)
    for field, value in body.model_dump().items():
        setattr(item, field, value)
    session.flush()
    append_audit(
        session,
        tenant_id=selected,
        actor_user_id=current.user.id,
        actor_email=current.user.email,
        action="user_access.assign",
        resource_type="user_access_assignment",
        resource_id=item.id,
        correlation_id=request.state.correlation_id,
        before_data=before,
        after_data=body.model_dump(),
    )
    session.commit()
    session.refresh(item)
    return item


def organization_path(session: Session, unit: OrganizationUnit | None, selected: str) -> list[str]:
    names: list[str] = []
    visited: set[str] = set()
    while unit and unit.id not in visited and unit.tenant_id == selected:
        visited.add(unit.id)
        names.append(unit.name)
        unit = session.get(OrganizationUnit, unit.parent_id) if unit.parent_id else None
    return list(reversed(names))


@router.get("/users/{user_id}/effective-access", response_model=EffectiveAccessResponse)
def effective_access(
    user_id: str,
    request: Request,
    current: Annotated[CurrentSession, Depends(get_current_session)],
    session: Annotated[Session, Depends(get_session)],
):
    selected = tenant_id(current)
    membership = session.scalar(
        select(Membership).where(
            Membership.user_id == user_id,
            Membership.tenant_id == selected,
            Membership.is_active.is_(True),
        )
    )
    if not membership:
        return error_response(request, 404, "EFFECTIVE_ACCESS_NOT_FOUND", "Usuário não encontrado.")
    assignment = session.scalar(
        select(UserAccessAssignment).where(
            UserAccessAssignment.user_id == user_id,
            UserAccessAssignment.tenant_id == selected,
            UserAccessAssignment.is_active.is_(True),
        )
    )
    profile = None
    unit = None
    permissions: set[str] = set()
    denied: set[str] = set()
    sources = [f"membership:{membership.role}"]
    if assignment:
        if assignment.profile_id:
            profile = session.scalar(
                select(AccessProfile).where(
                    AccessProfile.id == assignment.profile_id,
                    AccessProfile.tenant_id == selected,
                )
            )
        if assignment.organization_unit_id:
            unit = session.scalar(
                select(OrganizationUnit).where(
                    OrganizationUnit.id == assignment.organization_unit_id,
                    OrganizationUnit.tenant_id == selected,
                )
            )
        if profile:
            permissions.update(profile.permissions)
            sources.append(f"profile:{profile.name}:v{profile.version}")
        permissions.update(assignment.allow_permissions)
        denied.update(assignment.deny_permissions)
        permissions.difference_update(denied)
        if assignment.allow_permissions:
            sources.append("user:allow")
        if assignment.deny_permissions:
            sources.append("user:deny")
    return EffectiveAccessResponse(
        user_id=user_id,
        membership_role=membership.role,
        profile=(
            EffectiveProfile(id=profile.id, name=profile.name, version=profile.version)
            if profile
            else None
        ),
        organization_path=organization_path(session, unit, selected),
        job_title=assignment.job_title if assignment else "",
        function_name=assignment.function_name if assignment else "",
        scope=assignment.scope if assignment else {},
        permissions=sorted(permissions),
        denied_permissions=sorted(denied),
        sources=sources,
    )
