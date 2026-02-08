"""Add user_id to api_keys for user-level API keys.

Revision ID: 002_user_level_api_keys
Revises: 001_initial
Create Date: 2025-01-06

This migration:
1. Adds user_id column to api_keys table (nullable, FK to users)
2. Makes workspace_id nullable (was required before)
3. Adds CHECK constraint requiring at least one of user_id or workspace_id

User-level API keys (user_id set, workspace_id NULL) work for all workspaces
owned by that user. Workspace-level keys (workspace_id set, user_id NULL)
work for only that workspace.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "002_user_level_api_keys"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add user_id column (nullable)
    op.add_column(
        "api_keys",
        sa.Column("user_id", sa.UUID(), nullable=True),
    )

    # Add foreign key constraint
    op.create_foreign_key(
        "api_keys_user_id_fkey",
        "api_keys",
        "users",
        ["user_id"],
        ["id"],
    )

    # Make workspace_id nullable (was NOT NULL before)
    op.alter_column(
        "api_keys",
        "workspace_id",
        existing_type=sa.UUID(),
        nullable=True,
    )

    # Add CHECK constraint: at least one of user_id or workspace_id must be set
    op.create_check_constraint(
        "api_keys_scope_check",
        "api_keys",
        "user_id IS NOT NULL OR workspace_id IS NOT NULL",
    )


def downgrade() -> None:
    # Remove CHECK constraint
    op.drop_constraint("api_keys_scope_check", "api_keys", type_="check")

    # Make workspace_id NOT NULL again (will fail if any user-level keys exist!)
    op.alter_column(
        "api_keys",
        "workspace_id",
        existing_type=sa.UUID(),
        nullable=False,
    )

    # Remove foreign key and column
    op.drop_constraint("api_keys_user_id_fkey", "api_keys", type_="foreignkey")
    op.drop_column("api_keys", "user_id")

