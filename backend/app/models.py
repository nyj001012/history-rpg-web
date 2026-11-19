"""SQLAlchemy models for chapter playthroughs and their archives."""

from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    CheckConstraint,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    MetaData,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(table_name)s_%(column_0_N_name)s",
            "uq": "uq_%(table_name)s_%(column_0_N_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_N_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


id_type = BigInteger().with_variant(Integer(), "sqlite")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "(auth_type = 'guest' AND guest_hash IS NOT NULL AND email IS NULL) OR "
            "(auth_type = 'google' AND email IS NOT NULL AND guest_hash IS NULL)",
            name="auth_fields",
        ),
    )

    id: Mapped[int] = mapped_column(id_type, primary_key=True)
    auth_type: Mapped[str] = mapped_column(String(16))
    email: Mapped[str | None] = mapped_column(String(254), unique=True)
    guest_hash: Mapped[str | None] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Chapter(Base):
    __tablename__ = "chapters"

    id: Mapped[int] = mapped_column(id_type, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(Text)
    historical_year: Mapped[int]


class Part(Base):
    __tablename__ = "parts"
    __table_args__ = (
        UniqueConstraint("chapter_id", "sequence"),
        UniqueConstraint("chapter_id", "id"),
        CheckConstraint("sequence > 0", name="positive_sequence"),
    )

    id: Mapped[int] = mapped_column(id_type, primary_key=True)
    chapter_id: Mapped[int] = mapped_column(id_type, ForeignKey("chapters.id"))
    sequence: Mapped[int]
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(Text)
    historical_date: Mapped[date | None]


class Playthrough(Base):
    __tablename__ = "playthroughs"
    __table_args__ = (
        UniqueConstraint("id", "chapter_id"),
        Index(None, "user_id", "chapter_id"),
        Index(None, "chapter_id"),
        CheckConstraint(
            "(status = 'active' AND finished_at IS NULL) OR "
            "(status IN ('completed', 'abandoned') AND finished_at IS NOT NULL)",
            name="status_finished_at",
        ),
    )

    id: Mapped[int] = mapped_column(id_type, primary_key=True)
    user_id: Mapped[int] = mapped_column(id_type, ForeignKey("users.id"))
    chapter_id: Mapped[int] = mapped_column(id_type, ForeignKey("chapters.id"))
    status: Mapped[str] = mapped_column(String(16), server_default="active")
    started_at: Mapped[datetime] = mapped_column(server_default=func.now())
    finished_at: Mapped[datetime | None]


class Save(Base):
    # The shared chapter_id keeps both foreign keys within one chapter.
    __tablename__ = "saves"
    __table_args__ = (
        ForeignKeyConstraint(
            ["playthrough_id", "chapter_id"], ["playthroughs.id", "playthroughs.chapter_id"]
        ),
        ForeignKeyConstraint(["chapter_id", "part_id"], ["parts.chapter_id", "parts.id"]),
        Index(None, "playthrough_id", "chapter_id"),
        Index(None, "chapter_id", "part_id"),
    )

    playthrough_id: Mapped[int] = mapped_column(id_type, primary_key=True, autoincrement=False)
    chapter_id: Mapped[int] = mapped_column(id_type)
    part_id: Mapped[int] = mapped_column(id_type)
    stats: Mapped[dict[str, Any]] = mapped_column(JSON)
    summarized_memory: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


class PlayLog(Base):
    __tablename__ = "play_logs"
    __table_args__ = (
        ForeignKeyConstraint(
            ["playthrough_id", "chapter_id"], ["playthroughs.id", "playthroughs.chapter_id"]
        ),
        ForeignKeyConstraint(["chapter_id", "part_id"], ["parts.chapter_id", "parts.id"]),
        UniqueConstraint("playthrough_id", "turn_number"),
        Index(None, "playthrough_id", "chapter_id"),
        Index(None, "chapter_id", "part_id"),
        CheckConstraint("turn_number > 0", name="positive_turn_number"),
    )

    id: Mapped[int] = mapped_column(id_type, primary_key=True)
    playthrough_id: Mapped[int] = mapped_column(id_type)
    chapter_id: Mapped[int] = mapped_column(id_type)
    part_id: Mapped[int] = mapped_column(id_type)
    turn_number: Mapped[int]
    ai_narrative: Mapped[str] = mapped_column(Text)
    ai_question: Mapped[str | None] = mapped_column(Text)
    user_input: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class ClearEnding(Base):
    __tablename__ = "clear_endings"

    playthrough_id: Mapped[int] = mapped_column(
        id_type, ForeignKey("playthroughs.id"), primary_key=True, autoincrement=False
    )
    ending_title: Mapped[str] = mapped_column(String(255))
    final_stats: Mapped[dict[str, Any]] = mapped_column(JSON)
    real_history_diff: Mapped[str] = mapped_column(Text)
    cleared_at: Mapped[datetime] = mapped_column(server_default=func.now())
