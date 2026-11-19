import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Base, Chapter, ClearEnding, Part, Playthrough, Save, User


def test_mariadb_migration_and_data_constraints(monkeypatch):
    url = os.environ.get("MARIADB_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires a disposable MariaDB database.")
    assert make_url(url).database == "history_rpg_ci"
    engine = create_engine(url)

    try:
        assert inspect(engine).get_table_names() == []
        assert engine.dialect.is_mariadb
        monkeypatch.setenv("DATABASE_URL", url)
        config = Config(Path(__file__).parents[1] / "alembic.ini")
        command.upgrade(config, "head")
        expected_tables = {*Base.metadata.tables, "alembic_version"}
        assert set(inspect(engine).get_table_names()) == expected_tables

        stats = {"trust": 3, "events": ["바스티유"]}
        with Session(engine) as session:
            session.add(User(id=1, auth_type="guest", guest_hash="a" * 64))
            session.add_all([
                Chapter(id=1, title="French Revolution", summary="", historical_year=1789),
                Chapter(id=2, title="Founding of Joseon", summary="", historical_year=1392),
            ])
            session.flush()
            session.add_all([
                Part(id=1, chapter_id=1, sequence=1, title="Bastille", summary=""),
                Part(id=2, chapter_id=2, sequence=1, title="Founding", summary=""),
                Playthrough(id=1, user_id=1, chapter_id=1),
                Playthrough(id=2, user_id=1, chapter_id=2),
            ])
            session.flush()
            session.add(Save(playthrough_id=1, chapter_id=1, part_id=1, stats=stats))
            session.add(ClearEnding(
                playthrough_id=1, ending_title="Exile", final_stats=stats, real_history_diff=""
            ))
            session.commit()

        with Session(engine) as session:
            assert session.get(Save, 1).stats == stats
            assert session.get(ClearEnding, 1).final_stats == stats
            session.add(Save(playthrough_id=2, chapter_id=2, part_id=1, stats={}))
            with pytest.raises(IntegrityError) as rejected:
                session.flush()
            assert rejected.value.orig.args[0] == 1452

        command.downgrade(config, "base")
        assert inspect(engine).get_table_names() == ["alembic_version"]
        command.upgrade(config, "head")
        assert set(inspect(engine).get_table_names()) == expected_tables
        command.check(config)
    finally:
        engine.dispose()
