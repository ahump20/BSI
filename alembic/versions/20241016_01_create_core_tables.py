"""Bootstrap core NIL warehouse tables."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20241016_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "athletes",
        sa.Column("athlete_id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("sport", sa.String(length=64), nullable=False),
        sa.Column("school", sa.String(length=128), nullable=False),
    )

    op.create_table(
        "box_scores",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.String(length=64), sa.ForeignKey("athletes.athlete_id"), nullable=False),
        sa.Column("game_date", sa.Date(), nullable=False),
        sa.Column("opponent", sa.String(length=128), nullable=False),
        sa.Column("points", sa.Float(), nullable=False),
        sa.Column("assists", sa.Float(), nullable=False),
        sa.Column("rebounds", sa.Float(), nullable=False),
        sa.Column("efficiency", sa.Float(), nullable=False),
        sa.Column("minutes", sa.Float(), nullable=False),
    )

    op.create_table(
        "social_stats",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.String(length=64), sa.ForeignKey("athletes.athlete_id"), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False),
        sa.Column("stat_date", sa.Date(), nullable=False),
        sa.Column("followers", sa.Integer(), nullable=False),
        sa.Column("engagement_rate", sa.Float(), nullable=False),
        sa.Column("growth_rate", sa.Float(), nullable=False),
    )

    op.create_table(
        "search_interest",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.String(length=64), sa.ForeignKey("athletes.athlete_id"), nullable=False),
        sa.Column("stat_date", sa.Date(), nullable=False),
        sa.Column("interest_score", sa.Integer(), nullable=False),
    )

    op.create_table(
        "athlete_features",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.String(length=64), sa.ForeignKey("athletes.athlete_id"), nullable=False),
        sa.Column("as_of", sa.DateTime(), nullable=False),
        sa.Column("attention_score", sa.Float(), nullable=False),
        sa.Column("performance_index", sa.Float(), nullable=False),
    )

    op.create_table(
        "athlete_valuations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("athlete_id", sa.String(length=64), sa.ForeignKey("athletes.athlete_id"), nullable=False),
        sa.Column("as_of", sa.DateTime(), nullable=False),
        sa.Column("nil_value", sa.Numeric(12, 2), nullable=False),
        sa.Column("confidence_lower", sa.Numeric(12, 2), nullable=False),
        sa.Column("confidence_upper", sa.Numeric(12, 2), nullable=False),
        sa.Column("attention_score", sa.Float(), nullable=False),
        sa.Column("performance_index", sa.Float(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("athlete_valuations")
    op.drop_table("athlete_features")
    op.drop_table("search_interest")
    op.drop_table("social_stats")
    op.drop_table("box_scores")
    op.drop_table("athletes")
