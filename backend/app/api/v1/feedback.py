"""Feedback endpoints."""

from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.api.v1.admin import require_admin
from app.models.feedback import Feedback
from app.models.user import User

router = APIRouter(prefix="/feedback", tags=["feedback"])


# --- Schemas ---


class FeedbackCreate(BaseModel):
    """Create feedback request."""
    subject: str
    message: str


class FeedbackResponse(BaseModel):
    """Feedback response."""
    id: UUID
    subject: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminFeedbackResponse(BaseModel):
    """Feedback with user info for admin."""
    id: UUID
    subject: str
    message: str
    status: str
    created_at: datetime
    user_id: UUID
    user_email: str
    user_name: str

    class Config:
        from_attributes = True


class FeedbackStatusUpdate(BaseModel):
    """Update feedback status."""
    status: str  # "new", "read", "archived"


# --- User Endpoints ---


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FeedbackResponse:
    """Submit feedback. Requires authentication."""
    feedback = Feedback(
        user_id=current_user.id,
        subject=data.subject,
        message=data.message,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return FeedbackResponse.model_validate(feedback)


# --- Admin Endpoints ---


@router.get("/admin", response_model=List[AdminFeedbackResponse])
async def list_feedback(
    status_filter: str | None = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> List[AdminFeedbackResponse]:
    """List all feedback. Admin only."""
    query = select(Feedback).options(selectinload(Feedback.user)).order_by(Feedback.created_at.desc())
    
    if status_filter:
        query = query.where(Feedback.status == status_filter)
    
    result = await db.execute(query)
    feedbacks = result.scalars().all()
    
    return [
        AdminFeedbackResponse(
            id=f.id,
            subject=f.subject,
            message=f.message,
            status=f.status,
            created_at=f.created_at,
            user_id=f.user_id,
            user_email=f.user.email,
            user_name=f.user.name,
        )
        for f in feedbacks
    ]


@router.patch("/admin/{feedback_id}", response_model=AdminFeedbackResponse)
async def update_feedback_status(
    feedback_id: UUID,
    data: FeedbackStatusUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminFeedbackResponse:
    """Update feedback status. Admin only."""
    if data.status not in ("new", "read", "archived"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'new', 'read', or 'archived'",
        )
    
    result = await db.execute(
        select(Feedback).options(selectinload(Feedback.user)).where(Feedback.id == feedback_id)
    )
    feedback = result.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found",
        )
    
    feedback.status = data.status
    await db.commit()
    await db.refresh(feedback)
    
    return AdminFeedbackResponse(
        id=feedback.id,
        subject=feedback.subject,
        message=feedback.message,
        status=feedback.status,
        created_at=feedback.created_at,
        user_id=feedback.user_id,
        user_email=feedback.user.email,
        user_name=feedback.user.name,
    )

