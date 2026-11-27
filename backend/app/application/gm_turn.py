import asyncio
import logging
from dataclasses import dataclass
from typing import Protocol

from ..game_engine import TurnRecord
from ..schemas.gm import GMDecision


_MAX_ATTEMPTS = 3
_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class GMTurnContext:
    chapter_id: str
    turn: int
    current_trust: int
    scene_id: int
    recent_history: tuple[TurnRecord, ...]
    player_input: str


class GMProvider(Protocol):
    async def make_decision(self, context: GMTurnContext) -> GMDecision: ...


class GMProviderError(Exception):
    def __init__(self, reason: str, *, retryable: bool = True) -> None:
        super().__init__(reason)
        self.retryable = retryable


async def get_gm_decision(context: GMTurnContext, provider: GMProvider | None) -> GMDecision:
    if provider is None:
        return _build_fallback_decision()

    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            decision = await provider.make_decision(context)
            return decision
        except GMProviderError as error:
            if not error.retryable:
                _LOGGER.warning("결정 대체: %s, 시도 %d", error, attempt)
                break
            _LOGGER.warning("판단 요청 실패: %s, 시도 %d", error, attempt)
        if attempt < _MAX_ATTEMPTS:
            await asyncio.sleep(0.1 * attempt)

    return _build_fallback_decision()


def _build_fallback_decision() -> GMDecision:
    return GMDecision(
        narrative="광장에 잠시 정적이 흐릅니다. 사람들은 한 걸음 물러서고 당신 앞에 길이 열립니다.",
        tendency="moderate",
        trust_delta=0,
        scene_id=8,
    )
