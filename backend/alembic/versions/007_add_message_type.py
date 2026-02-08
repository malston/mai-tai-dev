"""Add message_type column to messages table.

Revision ID: 007_add_message_type
Revises: 006_add_agent_activity
Create Date: 2026-01-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007_add_message_type'
down_revision: Union[str, None] = '006_add_agent_activity'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add message_type column to messages table
    # 'chat' is the default for regular messages, 'system' for hidden system messages
    op.add_column('messages', sa.Column('message_type', sa.String(50), nullable=False, server_default='chat'))


def downgrade() -> None:
    op.drop_column('messages', 'message_type')

