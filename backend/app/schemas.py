from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator


Tendency = Literal["moderate", "radical", "madness"]
NonEmptyText = Annotated[str, StringConstraints(min_length=1)]
PlayerInput = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
SceneId = Annotated[int, Field(ge=1, le=10)]
TrustDelta = Annotated[int, Field(ge=-30, le=25)]
Choices = Annotated[list[str], Field(max_length=4)]
TRUST_DEPLETED = "trust_depleted"
TURN_LIMIT_REACHED = "turn_limit_reached"


class GameModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class StartRequest(GameModel):
    chapter_id: NonEmptyText


class TurnRequest(GameModel):
    session_id: NonEmptyText
    player_input: PlayerInput


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


class GMDecision(GameModel):
    narrative: NonEmptyText
    tendency: Tendency
    trust_delta: TrustDelta
    scene_id: SceneId
    ending: NonEmptyText | None = None
    choices: Choices = Field(default_factory=list)

    @field_validator("narrative")
    @classmethod
    def validate_narrative(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("지문이 비어 있습니다.")
        return value

    @field_validator("ending")
    @classmethod
    def validate_ending(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value or value in {TRUST_DEPLETED, TURN_LIMIT_REACHED}:
            raise ValueError("모델이 지정할 수 없는 엔딩입니다.")
        return value
