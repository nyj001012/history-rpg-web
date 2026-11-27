from typing import Literal

from pydantic import ConfigDict, Field

from .common import Choices, GameModel, NonEmptyText, SceneId, Tendency, TrustDelta


class StartResponse(GameModel):
    session_id: NonEmptyText
    chapter_id: NonEmptyText
    turn: Literal[1]
    narrative: NonEmptyText
    current_trust: Literal[50]
    scene_id: SceneId
    asset_key: str
    choices: Choices


class TurnResponse(GameModel):
    model_config = ConfigDict(frozen=True)

    session_id: NonEmptyText
    chapter_id: NonEmptyText
    turn: int = Field(ge=2, le=20)
    narrative: NonEmptyText
    tendency: Tendency
    trust_delta: TrustDelta
    current_trust: int = Field(ge=0, le=100)
    scene_id: SceneId
    asset_key: str
    ending: NonEmptyText | None
    choices: Choices


class Error(GameModel):
    detail: str
