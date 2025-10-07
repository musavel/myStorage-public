"""add field_mapping column to collections

Revision ID: 001
Revises:
Create Date: 2025-10-06 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add field_mapping column if it doesn't exist
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='collections' AND column_name='field_mapping'
            ) THEN
                ALTER TABLE collections ADD COLUMN field_mapping JSONB;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Remove field_mapping column
    op.drop_column('collections', 'field_mapping')
