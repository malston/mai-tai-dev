"""Add workspace_agent_activity table.

Revision ID: 006_add_agent_activity
Revises: 005_add_oauth
Create Date: 2026-01-25

Tracks agent activity per-workspace, updated on every MCP API call.
This enables correct agent status display for user-level API keys.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '006_add_agent_activity'
down_revision: Union[str, None] = '005_add_oauth'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'workspace_agent_activity',
        sa.Column('workspace_id', UUID(as_uuid=True), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('last_activity_at', sa.DateTime(), nullable=False),
        sa.Column('api_key_id', UUID(as_uuid=True), sa.ForeignKey('api_keys.id', ondelete='SET NULL'), nullable=True),
    )
    
    # Index for quick lookups by workspace
    op.create_index('ix_workspace_agent_activity_workspace_id', 'workspace_agent_activity', ['workspace_id'])


def downgrade() -> None:
    op.drop_index('ix_workspace_agent_activity_workspace_id', table_name='workspace_agent_activity')
    op.drop_table('workspace_agent_activity')

