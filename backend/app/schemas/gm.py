from pydantic import Field, field_validator

from .common import (
    TRUST_DEPLETED,
    TURN_LIMIT_REACHED,
    Choices,
    GameModel,
    NonEmptyText,
    SceneId,
    Tendency,
    TrustDelta,
)


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
