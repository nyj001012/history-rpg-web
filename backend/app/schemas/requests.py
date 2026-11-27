from typing import Annotated

from pydantic import StringConstraints

from .common import GameModel, NonEmptyText


PlayerInput = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class StartRequest(GameModel):
    chapter_id: NonEmptyText


class TurnRequest(GameModel):
    session_id: NonEmptyText
    player_input: PlayerInput
