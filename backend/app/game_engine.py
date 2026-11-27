from collections import deque
from dataclasses import dataclass, field
from typing import Literal

from .schemas.common import TRUST_DEPLETED, TURN_LIMIT_REACHED
from .schemas.gm import GMDecision
from .schemas.responses import StartResponse, TurnResponse


@dataclass(frozen=True)
class ChapterConfig:
    chapter_id: str
    opening: str
    choices: tuple[str, ...]
    initial_trust: Literal[50] = 50
    initial_scene: int = 1
    max_trust: int = 100
    max_turn: int = 20


CHAPTERS = {
    "ch1_revolution": ChapterConfig(
        chapter_id="ch1_revolution",
        opening=(
            "1789년 파리, 바스티유 앞에서 군중이 모여듭니다. "
            "성문을 지키는 병사와 군중 대표가 마주 선 사이로 작은 쪽지가 당신 발밑에 떨어집니다."
        ),
        choices=("쪽지를 살핀다", "군중 대표에게 말을 건다", "한 걸음 물러서서 상황을 지켜본다"),
    ),
}


class SessionEnded(Exception):
    pass


def build_asset_key(chapter_id: str, scene_id: int) -> str:
    return f"{chapter_id}_scene_{scene_id:02d}"


@dataclass(frozen=True)
class TurnRecord:
    turn: int
    player_input: str
    response: TurnResponse


@dataclass
class GameSession:
    session_id: str
    chapter: ChapterConfig
    turn: int = field(init=False, default=1)
    current_trust: int = field(init=False)
    scene_id: int = field(init=False)
    ending: str | None = field(init=False, default=None)
    recent_history: deque[TurnRecord] = field(
        init=False, default_factory=lambda: deque(maxlen=4)
    )

    def __post_init__(self) -> None:
        self.current_trust = self.chapter.initial_trust
        self.scene_id = self.chapter.initial_scene

    def opening_response(self) -> StartResponse:
        return StartResponse(
            session_id=self.session_id,
            chapter_id=self.chapter.chapter_id,
            turn=1,
            narrative=self.chapter.opening,
            current_trust=self.chapter.initial_trust,
            scene_id=self.chapter.initial_scene,
            asset_key=build_asset_key(self.chapter.chapter_id, self.chapter.initial_scene),
            choices=list(self.chapter.choices),
        )

    def require_active(self) -> None:
        if self.ending is not None:
            raise SessionEnded

    def apply_decision(self, player_input: str, decision: GMDecision) -> TurnResponse:
        self.require_active()
        turn = self.turn + 1
        trust = max(0, min(self.chapter.max_trust, self.current_trust + decision.trust_delta))
        ending = decision.ending
        if trust == 0:
            ending = TRUST_DEPLETED
        elif turn >= self.chapter.max_turn:
            ending = TURN_LIMIT_REACHED

        response = TurnResponse(
            session_id=self.session_id,
            chapter_id=self.chapter.chapter_id,
            turn=turn,
            narrative=decision.narrative,
            tendency=decision.tendency,
            trust_delta=trust - self.current_trust,
            current_trust=trust,
            scene_id=decision.scene_id,
            asset_key=build_asset_key(self.chapter.chapter_id, decision.scene_id),
            ending=ending,
            choices=list(decision.choices) if ending is None else [],
        )
        self.turn = turn
        self.current_trust = trust
        self.scene_id = response.scene_id
        self.ending = ending
        self.recent_history.append(TurnRecord(turn, player_input, response))
        return response
