"""API Key schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    """Schema for creating an API key (workspace-scoped)."""

    name: str = Field(..., min_length=1, max_length=255)
    scopes: list[str] = Field(default=["read", "write"])
    expires_in_days: int | None = Field(None, gt=0)


class UserApiKeyCreate(BaseModel):
    """Schema for creating a user-level API key."""

    name: str = Field(..., min_length=1, max_length=255)
    scopes: list[str] = Field(default=["read", "write"])
    expires_in_days: int | None = Field(None, gt=0)


class ApiKeyResponse(BaseModel):
    """Schema for API key response (includes key, only on creation)."""

    id: UUID
    name: str
    key: str  # Only returned on creation!
    user_id: UUID | None = None
    workspace_id: UUID | None = None
    scopes: list[str]
    expires_at: datetime | None
    created_at: datetime

    @property
    def is_user_level(self) -> bool:
        """Return True if this is a user-level API key."""
        return self.user_id is not None


class ApiKeyListItem(BaseModel):
    """Schema for API key list item (no key shown)."""

    id: UUID
    name: str | None
    user_id: UUID | None = None
    workspace_id: UUID | None = None
    scopes: list[str]
    expires_at: datetime | None
    last_used_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}

    @property
    def is_user_level(self) -> bool:
        """Return True if this is a user-level API key."""
        return self.user_id is not None


class ApiKeyListResponse(BaseModel):
    """Schema for list of API keys."""

    api_keys: list[ApiKeyListItem]
    total: int

