"""API Key model."""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ApiKey(Base):
    """API key for MCP server authentication.

    API keys can be scoped in two ways:
    - User-level: user_id is set, workspace_id is NULL. Works for all user's workspaces.
    - Workspace-level: workspace_id is set, user_id is NULL. Works for one workspace only.

    At least one of user_id or workspace_id must be set.
    """
    __tablename__ = "api_keys"
    __table_args__ = (
        CheckConstraint(
            "user_id IS NOT NULL OR workspace_id IS NOT NULL",
            name="api_keys_scope_check"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("workspaces.id"), nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    scopes: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="api_keys")
    workspace: Mapped["Workspace"] = relationship(back_populates="api_keys")

    @property
    def is_user_level(self) -> bool:
        """Return True if this is a user-level API key."""
        return self.user_id is not None

