from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.exc import IntegrityError

from app.models import Base, Chapter, ClearEnding, Part, PlayLog, Playthrough, Save, User


@pytest.fixture
def migrated_database(tmp_path, monkeypatch):
    url = f"sqlite:///{tmp_path / 'schema.db'}"
    monkeypatch.setenv("DATABASE_URL", url)
    config = Config(Path(__file__).parents[1] / "alembic.ini")
    command.upgrade(config, "head")
    engine = create_engine(url)
    try:
        yield config, engine
    finally:
        engine.dispose()


def test_initial_migration_matches_models_and_downgrades(migrated_database):
    config, engine = migrated_database
    assert set(inspect(engine).get_table_names()) == {*Base.metadata.tables, "alembic_version"}
    command.check(config)

    command.downgrade(config, "base")
    assert set(inspect(engine).get_table_names()) == {"alembic_version"}


def test_playthrough_archive_and_save_constraints(migrated_database):
    _, engine = migrated_database
    with engine.begin() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")
        connection.execute(User.__table__.insert(), {"id": 1, "auth_type": "guest", "guest_hash": "a" * 64})
        connection.execute(Chapter.__table__.insert(), [
            {"id": 1, "title": "French Revolution", "summary": "", "historical_year": 1789},
            {"id": 2, "title": "Founding of Joseon", "summary": "", "historical_year": 1392},
        ])
        connection.execute(Part.__table__.insert(), [
            {"id": 1, "chapter_id": 1, "sequence": 1, "title": "Bastille", "summary": ""},
            {"id": 2, "chapter_id": 2, "sequence": 1, "title": "Founding", "summary": ""},
        ])
        connection.execute(Playthrough.__table__.insert(), [
            {"id": 1, "user_id": 1, "chapter_id": 1},
            {"id": 2, "user_id": 1, "chapter_id": 2},
            {"id": 3, "user_id": 1, "chapter_id": 1},
        ])

        save = {"playthrough_id": 1, "chapter_id": 1, "part_id": 1, "stats": {}}
        connection.execute(Save.__table__.insert(), save)
        connection.execute(Save.__table__.insert(), {**save, "playthrough_id": 2, "chapter_id": 2, "part_id": 2})
        connection.execute(Save.__table__.insert(), {**save, "playthrough_id": 3})
        assert connection.scalars(select(Save.playthrough_id).order_by(Save.playthrough_id)).all() == [1, 2, 3]

        log = {
            "playthrough_id": 1,
            "chapter_id": 1,
            "part_id": 1,
            "turn_number": 1,
            "ai_narrative": "The gates are open.",
            "ai_question": "What do you do?",
        }
        connection.execute(PlayLog.__table__.insert(), log)
        connection.execute(PlayLog.__table__.insert(), {**log, "playthrough_id": 3})

        ending = {"playthrough_id": 1, "ending_title": "Exile", "final_stats": {}, "real_history_diff": ""}
        connection.execute(ClearEnding.__table__.insert(), ending)
        connection.execute(ClearEnding.__table__.insert(), {**ending, "playthrough_id": 3})

        invalid_inserts = [
            (Save, save, "UNIQUE"),
            (PlayLog, log, "UNIQUE"),
            (ClearEnding, ending, "UNIQUE"),
            (PlayLog, {**log, "turn_number": 2, "part_id": 2}, "FOREIGN KEY"),
            (PlayLog, {**log, "turn_number": 2, "chapter_id": 2, "part_id": 2}, "FOREIGN KEY"),
            (Part, {"chapter_id": 1, "sequence": 1, "title": "Duplicate", "summary": ""}, "UNIQUE"),
        ]
        for model, values, error in invalid_inserts:
            with pytest.raises(IntegrityError, match=error), connection.begin_nested():
                connection.execute(model.__table__.insert(), values)

        connection.execute(User.__table__.update().where(User.id == 1).values(
            auth_type="google", email="player@example.com", guest_hash=None
        ))
        assert connection.scalars(select(Playthrough.user_id)).all() == [1, 1, 1]
