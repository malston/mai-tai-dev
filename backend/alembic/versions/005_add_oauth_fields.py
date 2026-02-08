"""Add OAuth fields to users table.

Revision ID: 005_add_oauth
Revises: 004_add_feedback
Create Date: 2026-01-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_add_oauth'
down_revision: Union[str, None] = '004_add_feedback'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add OAuth fields to users table
    op.add_column('users', sa.Column('oauth_provider', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('oauth_id', sa.String(255), nullable=True))
    
    # Make password_hash nullable for OAuth users
    op.alter_column('users', 'password_hash',
                    existing_type=sa.String(255),
                    nullable=True)
    
    # Create unique index on oauth_provider + oauth_id combination
    op.create_index('ix_users_oauth_provider_id', 'users', ['oauth_provider', 'oauth_id'], unique=True)


def downgrade() -> None:
    # Drop the index
    op.drop_index('ix_users_oauth_provider_id', table_name='users')
    
    # Make password_hash required again
    op.alter_column('users', 'password_hash',
                    existing_type=sa.String(255),
                    nullable=False)
    
    # Remove OAuth columns
    op.drop_column('users', 'oauth_id')
    op.drop_column('users', 'oauth_provider')

