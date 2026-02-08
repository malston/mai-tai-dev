"""Message schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    """Schema for creating a message."""

    content: str = Field(..., min_length=1)
    metadata: dict = Field(default_factory=dict)
    message_type: str = Field(default="chat")  # 'chat' or 'system'


class MessageResponse(BaseModel):
    """Schema for message response."""

    id: UUID
    workspace_id: UUID
    user_id: UUID | None = None
    agent_name: str | None = None
    sender_name: str | None = None
    sender_avatar_url: str | None = None
    content: str
    message_metadata: dict
    created_at: datetime
    seen_at: datetime | None = None  # When agent acknowledged this message
    message_type: str = "chat"

    model_config = {"from_attributes": True}


class MessageListResponse(BaseModel):
    """Schema for list of messages with pagination info."""

    messages: list[MessageResponse]
    has_more: bool
    total: int


class MessageAcknowledgeRequest(BaseModel):
    """Schema for acknowledging messages as seen."""

    message_ids: list[UUID] = Field(..., min_length=1)


class MessageAcknowledgeResponse(BaseModel):
    """Schema for acknowledge response."""

    acknowledged: int
    message_ids: list[UUID]

