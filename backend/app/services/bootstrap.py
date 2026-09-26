from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.identity import Membership, Tenant, User
from app.repositories.identity import get_user_by_email, list_active_memberships
from app.security.passwords import hash_password
from app.services.auth import normalize_email
from app.services.default_catalog import seed_default_catalog


@dataclass
class BootstrapResult:
    status: str


def bootstrap_initial_admin(session: Session, settings) -> BootstrapResult:
    if (
        not settings.bootstrap_admin_email
        or not settings.bootstrap_admin_password
        or not settings.bootstrap_admin_name
    ):
        raise ValueError("Configuração do bootstrap administrativo incompleta")
    email = normalize_email(settings.bootstrap_admin_email)
    existing = get_user_by_email(session, email)
    if existing:
        memberships = list_active_memberships(session, existing.id)
        configured = next(
            (
                t
                for m, t in memberships
                if m.role == "superadmin" and t.slug == settings.bootstrap_tenant_slug
            ),
            None,
        )
        if configured:
            seed_default_catalog(session, configured.id)
            return BootstrapResult("already_configured")
        return BootstrapResult("conflict")
    tenant = session.query(Tenant).filter_by(slug=settings.bootstrap_tenant_slug).one_or_none()
    if tenant is None:
        tenant = Tenant(name=settings.bootstrap_tenant_name, slug=settings.bootstrap_tenant_slug)
        session.add(tenant)
        session.flush()
    user = User(
        email=email,
        email_normalized=email,
        password_hash=hash_password(settings.bootstrap_admin_password.get_secret_value()),
        full_name=settings.bootstrap_admin_name,
    )
    session.add(user)
    session.flush()
    session.add(Membership(user_id=user.id, tenant_id=tenant.id, role="superadmin"))
    session.commit()
    seed_default_catalog(session, tenant.id)
    return BootstrapResult("created")
