"""Add seen_at column to messages table.

Revision ID: 003_add_seen_at
Revises: 002_user_level_api_keys
Create Date: 2026-01-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_add_seen_at'
down_revision: Union[str, None] = '002_user_level_api_keys'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add seen_at column to messages table
    op.add_column('messages', sa.Column('seen_at', sa.DateTime(), nullable=True))
    
    # Add index for efficient unseen message queries
    # This index helps with: WHERE seen_at IS NULL AND user_id IS NOT NULL
    op.create_index(
        'idx_messages_unseen',
        'messages',
        ['workspace_id', 'seen_at'],
        postgresql_where=sa.text('seen_at IS NULL AND user_id IS NOT NULL')
    )


def downgrade() -> None:
    op.drop_index('idx_messages_unseen', table_name='messages')
    op.drop_column('messages', 'seen_at')

