from app.core.config import get_settings
from app.db.session import Base, engine
from app.models import (  # noqa: F401
    AccessProfile,
    AuditLog,
    AuthSession,
    CapabilityManifest,
    Configuration,
    Membership,
    PermissionDefinition,
    ProductUser,
    SaasProduct,
    Tenant,
    User,
)

from alembic import context

target_metadata = Base.metadata

if context.is_offline_mode():
    context.configure(
        url=get_settings().database_url.get_secret_value(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()
else:
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
