from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


Tendency = Literal["moderate", "radical", "madness"]
NonEmptyText = Annotated[str, StringConstraints(min_length=1)]
SceneId = Annotated[int, Field(ge=1, le=10)]
TrustDelta = Annotated[int, Field(ge=-30, le=25)]
Choices = Annotated[list[str], Field(max_length=4)]
TRUST_DEPLETED = "trust_depleted"
TURN_LIMIT_REACHED = "turn_limit_reached"


class GameModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
