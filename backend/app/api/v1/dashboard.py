"""Dashboard API endpoints."""

from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.message import Message
from app.models.workspace import Workspace
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardStatsResponse(BaseModel):
    """Dashboard statistics response."""
    total_messages: int
    messages_this_week: int
    active_workspaces: int
    total_workspaces: int


class DailyActivityItem(BaseModel):
    """Single day activity data."""
    date: str  # YYYY-MM-DD format
    count: int


class DailyActivityResponse(BaseModel):
    """Daily activity response for heatmap."""
    activity: list[DailyActivityItem]


class WorkspaceActivityItem(BaseModel):
    """Workspace with activity count."""
    id: UUID
    name: str
    message_count: int
    last_activity: datetime | None


class BusiestWorkspacesResponse(BaseModel):
    """Busiest workspaces response."""
    workspaces: list[WorkspaceActivityItem]


def _user_workspaces_subquery(user_id: UUID):
    """Return a subquery for workspaces the user owns."""
    return select(Workspace.id).where(
        and_(
            Workspace.archived == False,  # noqa: E712
            Workspace.owner_id == user_id
        )
    )


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get dashboard statistics for the current user."""
    user_id = current_user.id

    # Get user's workspace IDs
    workspace_ids_subquery = _user_workspaces_subquery(user_id)

    # Total messages across user's workspaces
    total_messages_result = await db.execute(
        select(func.count(Message.id)).where(
            Message.workspace_id.in_(workspace_ids_subquery)
        )
    )
    total_messages = total_messages_result.scalar() or 0

    # Messages this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    messages_this_week_result = await db.execute(
        select(func.count(Message.id)).where(
            and_(
                Message.workspace_id.in_(workspace_ids_subquery),
                Message.created_at >= week_ago
            )
        )
    )
    messages_this_week = messages_this_week_result.scalar() or 0

    # Active workspaces count (non-archived)
    active_workspaces_result = await db.execute(
        select(func.count()).select_from(
            workspace_ids_subquery.subquery()
        )
    )
    active_workspaces = active_workspaces_result.scalar() or 0

    # Total workspaces (including archived)
    total_workspaces_subquery = select(Workspace.id).where(Workspace.owner_id == user_id)
    total_workspaces_result = await db.execute(
        select(func.count()).select_from(
            total_workspaces_subquery.subquery()
        )
    )
    total_workspaces = total_workspaces_result.scalar() or 0

    return {
        "total_messages": total_messages,
        "messages_this_week": messages_this_week,
        "active_workspaces": active_workspaces,
        "total_workspaces": total_workspaces,
    }


@router.get("/activity", response_model=DailyActivityResponse)
async def get_daily_activity(
    days: int = 90,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get daily message activity for heatmap visualization."""
    user_id = current_user.id

    # Limit days to reasonable range
    days = min(max(days, 30), 365)
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get user's workspace IDs
    workspace_ids_subquery = _user_workspaces_subquery(user_id)

    # Get daily message counts
    result = await db.execute(
        select(
            func.date(Message.created_at).label("date"),
            func.count(Message.id).label("count")
        ).where(
            and_(
                Message.workspace_id.in_(workspace_ids_subquery),
                Message.created_at >= start_date
            )
        ).group_by(
            func.date(Message.created_at)
        ).order_by(
            func.date(Message.created_at)
        )
    )

    activity = [
        {"date": str(row.date), "count": row.count}
        for row in result.all()
    ]

    return {"activity": activity}


@router.get("/busiest-workspaces", response_model=BusiestWorkspacesResponse)
async def get_busiest_workspaces(
    limit: int = 6,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get workspaces sorted by recent activity (message count in last 30 days)."""
    user_id = current_user.id
    limit = min(max(limit, 1), 20)

    # Get user's active workspaces
    workspace_ids_subquery = _user_workspaces_subquery(user_id)

    # Time window for "recent" activity
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    # Get workspaces with message counts and last activity
    result = await db.execute(
        select(
            Workspace.id,
            Workspace.name,
            func.count(Message.id).label("message_count"),
            func.max(Message.created_at).label("last_activity")
        ).outerjoin(
            Message, and_(
                Message.workspace_id == Workspace.id,
                Message.created_at >= thirty_days_ago
            )
        ).where(
            Workspace.id.in_(workspace_ids_subquery)
        ).group_by(
            Workspace.id, Workspace.name
        ).order_by(
            func.count(Message.id).desc(),
            func.max(Message.created_at).desc().nulls_last()
        ).limit(limit)
    )

    workspaces = [
        {
            "id": row.id,
            "name": row.name,
            "message_count": row.message_count or 0,
            "last_activity": row.last_activity,
        }
        for row in result.all()
    ]

    return {"workspaces": workspaces}
