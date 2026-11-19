"""create history RPG schema

Revision ID: 0001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'chapters',
        sa.Column('id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('historical_year', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_chapters')),
    )
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('auth_type', sa.String(length=16), nullable=False),
        sa.Column('email', sa.String(length=254), nullable=True),
        sa.Column('guest_hash', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "(auth_type = 'guest' AND guest_hash IS NOT NULL AND email IS NULL) OR "
            "(auth_type = 'google' AND email IS NOT NULL AND guest_hash IS NULL)",
            name=op.f('ck_users_auth_fields'),
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
        sa.UniqueConstraint('email', name=op.f('uq_users_email')),
        sa.UniqueConstraint('guest_hash', name=op.f('uq_users_guest_hash')),
    )
    op.create_table(
        'parts',
        sa.Column('id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('chapter_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('historical_date', sa.Date(), nullable=True),
        sa.CheckConstraint('sequence > 0', name=op.f('ck_parts_positive_sequence')),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], name=op.f('fk_parts_chapter_id')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_parts')),
        sa.UniqueConstraint('chapter_id', 'id', name=op.f('uq_parts_chapter_id_id')),
        sa.UniqueConstraint('chapter_id', 'sequence', name=op.f('uq_parts_chapter_id_sequence')),
    )
    op.create_table(
        'playthroughs',
        sa.Column('id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('user_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('chapter_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('status', sa.String(length=16), server_default='active', nullable=False),
        sa.Column('started_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.CheckConstraint(
            "(status = 'active' AND finished_at IS NULL) OR "
            "(status IN ('completed', 'abandoned') AND finished_at IS NOT NULL)",
            name=op.f('ck_playthroughs_status_finished_at'),
        ),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], name=op.f('fk_playthroughs_chapter_id')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_playthroughs_user_id')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_playthroughs')),
        sa.UniqueConstraint('id', 'chapter_id', name=op.f('uq_playthroughs_id_chapter_id')),
    )
    op.create_index(op.f('ix_playthroughs_chapter_id'), 'playthroughs', ['chapter_id'], unique=False)
    op.create_index(op.f('ix_playthroughs_user_id_chapter_id'), 'playthroughs', ['user_id', 'chapter_id'], unique=False)
    op.create_table(
        'clear_endings',
        sa.Column('playthrough_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), autoincrement=False, nullable=False),
        sa.Column('ending_title', sa.String(length=255), nullable=False),
        sa.Column('final_stats', sa.JSON(), nullable=False),
        sa.Column('real_history_diff', sa.Text(), nullable=False),
        sa.Column('cleared_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ['playthrough_id'],
            ['playthroughs.id'],
            name=op.f('fk_clear_endings_playthrough_id'),
        ),
        sa.PrimaryKeyConstraint('playthrough_id', name=op.f('pk_clear_endings')),
    )
    op.create_table(
        'play_logs',
        sa.Column('id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('playthrough_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('chapter_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('part_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('turn_number', sa.Integer(), nullable=False),
        sa.Column('ai_narrative', sa.Text(), nullable=False),
        sa.Column('ai_question', sa.Text(), nullable=True),
        sa.Column('user_input', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('turn_number > 0', name=op.f('ck_play_logs_positive_turn_number')),
        sa.ForeignKeyConstraint(
            ['chapter_id', 'part_id'],
            ['parts.chapter_id', 'parts.id'],
            name=op.f('fk_play_logs_chapter_id_part_id'),
        ),
        sa.ForeignKeyConstraint(
            ['playthrough_id', 'chapter_id'],
            ['playthroughs.id', 'playthroughs.chapter_id'],
            name=op.f('fk_play_logs_playthrough_id_chapter_id'),
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_play_logs')),
        sa.UniqueConstraint('playthrough_id', 'turn_number', name=op.f('uq_play_logs_playthrough_id_turn_number')),
    )
    op.create_index(op.f('ix_play_logs_chapter_id_part_id'), 'play_logs', ['chapter_id', 'part_id'], unique=False)
    op.create_index(op.f('ix_play_logs_playthrough_id_chapter_id'), 'play_logs', ['playthrough_id', 'chapter_id'], unique=False)
    op.create_table(
        'saves',
        sa.Column('playthrough_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), autoincrement=False, nullable=False),
        sa.Column('chapter_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('part_id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), nullable=False),
        sa.Column('stats', sa.JSON(), nullable=False),
        sa.Column('summarized_memory', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ['chapter_id', 'part_id'],
            ['parts.chapter_id', 'parts.id'],
            name=op.f('fk_saves_chapter_id_part_id'),
        ),
        sa.ForeignKeyConstraint(
            ['playthrough_id', 'chapter_id'],
            ['playthroughs.id', 'playthroughs.chapter_id'],
            name=op.f('fk_saves_playthrough_id_chapter_id'),
        ),
        sa.PrimaryKeyConstraint('playthrough_id', name=op.f('pk_saves')),
    )
    op.create_index(
        op.f('ix_saves_playthrough_id_chapter_id'), 'saves', ['playthrough_id', 'chapter_id']
    )
    op.create_index(op.f('ix_saves_chapter_id_part_id'), 'saves', ['chapter_id', 'part_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('saves')
    op.drop_table('play_logs')
    op.drop_table('clear_endings')
    op.drop_table('playthroughs')
    op.drop_table('parts')
    op.drop_table('users')
    op.drop_table('chapters')
