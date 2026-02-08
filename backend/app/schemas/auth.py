"""Auth schemas for request/response validation."""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    name: str
    password: str
    agent_type: str | None = None  # "augment", "claude", "cursor", "windsurf", "gemini", "other"


class UserLogin(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str


class UserSettings(BaseModel):
    """Schema for user settings."""

    timezone: str | None = None
    time_format: str | None = None  # "12h" or "24h"


class UserResponse(BaseModel):
    """Schema for user response (no password)."""

    id: UUID
    email: str
    name: str
    avatar_url: str | None = None
    is_admin: bool = False
    settings: dict[str, Any] | None = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    name: str | None = None
    avatar_url: str | None = None
    settings: dict[str, Any] | None = None


class PasswordChange(BaseModel):
    """Schema for changing password."""

    current_password: str
    new_password: str


class ProvisionedWorkspace(BaseModel):
    """Schema for auto-provisioned workspace info."""

    id: UUID
    name: str
    settings: dict[str, Any]


class ProvisionedApiKey(BaseModel):
    """Schema for auto-provisioned API key info."""

    id: UUID
    key: str  # Raw key, only returned once!
    name: str


class RegisterResponse(BaseModel):
    """Schema for registration response with auto-provisioned resources."""

    user: UserResponse
    workspace: ProvisionedWorkspace
    api_key: ProvisionedApiKey


class OAuthLogin(BaseModel):
    """Schema for OAuth login request."""

    provider: str  # "github" or "google"
    oauth_id: str  # Provider's user ID
    email: EmailStr
    name: str
    avatar_url: str | None = None


class OAuthResponse(BaseModel):
    """Schema for OAuth login response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    is_new_user: bool = False  # True if user was just created
    user: UserResponse
    # For new users, include provisioned resources (like /register does)
    workspace: ProvisionedWorkspace | None = None
    api_key: ProvisionedApiKey | None = None

