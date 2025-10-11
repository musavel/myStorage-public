"""add is_public to collections table

Revision ID: 003
Revises: 002
Create Date: 2025-10-11

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_public column to collections table with default True
    op.add_column('collections', sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    # Remove is_public column from collections table
    op.drop_column('collections', 'is_public')
