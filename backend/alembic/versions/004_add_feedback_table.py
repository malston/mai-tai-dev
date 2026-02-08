"""Add feedback table.

Revision ID: 004_add_feedback
Revises: 003_add_seen_at
Create Date: 2026-01-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_add_feedback'
down_revision: Union[str, None] = '003_add_seen_at'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'feedback',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('subject', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='new'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Index for filtering by status
    op.create_index('idx_feedback_status', 'feedback', ['status'])
    
    # Index for ordering by created_at
    op.create_index('idx_feedback_created_at', 'feedback', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_feedback_created_at', table_name='feedback')
    op.drop_index('idx_feedback_status', table_name='feedback')
    op.drop_table('feedback')

