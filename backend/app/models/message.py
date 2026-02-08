"""Message model."""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Message(Base):
    """A message in a workspace. Can be from a user or an agent."""
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)  # NULL for agent messages
    agent_name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # For AI/agent messages
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_metadata: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    seen_at: Mapped[datetime | None] = mapped_column(nullable=True)  # When agent acknowledged this message
    message_type: Mapped[str] = mapped_column(String(50), default="chat")  # 'chat' or 'system'

    # Relationships
    workspace: Mapped["Workspace"] = relationship(back_populates="messages")
    user: Mapped["User"] = relationship()

