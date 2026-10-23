"""Throttle failed logins per account and source address."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0014_login_throttles"
down_revision: str | None = "0013_operation_requester"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "login_throttles",
        sa.Column("key_hash", sa.String(64), nullable=False),
        sa.Column("failures", sa.Integer(), nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("key_hash"),
    )
    op.create_index("ix_login_throttles_updated_at", "login_throttles", ["updated_at"])


def downgrade() -> None:
    op.drop_index("ix_login_throttles_updated_at", table_name="login_throttles")
    op.drop_table("login_throttles")
