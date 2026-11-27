import asyncio
import logging
from collections.abc import Awaitable, Callable

import httpx
from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from .config import GeminiSettings
from .prompts import GM_SYSTEM_INSTRUCTION, GMTurnContext
from .schemas import GMDecision


GMTransport = Callable[[str, str], Awaitable[str]]
_MAX_ATTEMPTS = 3
_TRANSIENT_STATUS = {408, 429, 500, 502, 503, 504}
_LOGGER = logging.getLogger(__name__)


def _fallback_decision() -> GMDecision:
    return GMDecision(
        narrative="광장에 잠시 정적이 흐릅니다. 사람들은 한 걸음 물러서고 당신 앞에 길이 열립니다.",
        tendency="moderate",
        trust_delta=0,
        scene_id=8,
    )


def _handle_turn_error(error: Exception, attempt: int) -> bool:
    if isinstance(error, ValidationError):
        reason = "invalid_output"
    elif isinstance(error, errors.APIError):
        if error.code not in _TRANSIENT_STATUS:
            _LOGGER.warning("결정 대체: provider_error, 시도 %d", attempt)
            return False
        reason = "transient_provider_error"
    else:
        reason = "transport"
    _LOGGER.warning("판단 요청 실패: %s, 시도 %d", reason, attempt)
    return True


class GMService:
    def __init__(self, transport: GMTransport | None, timeout_seconds: float) -> None:
        self._transport = transport
        self._timeout_seconds = timeout_seconds

    async def run_turn(self, context: GMTurnContext) -> GMDecision:
        if self._transport is None:
            return _fallback_decision()

        context_json = context.to_json()
        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                async with asyncio.timeout(self._timeout_seconds):
                    response_json = await self._transport(GM_SYSTEM_INSTRUCTION, context_json)
                return GMDecision.model_validate_json(response_json)
            except (
                ValidationError,
                TimeoutError,
                ConnectionError,
                httpx.TransportError,
                errors.APIError,
            ) as error:
                if not _handle_turn_error(error, attempt):
                    break
            if attempt < _MAX_ATTEMPTS:
                await asyncio.sleep(0.1 * attempt)
        return _fallback_decision()


def create_gemini_client(settings: GeminiSettings) -> genai.Client:
    return genai.Client(
        vertexai=False,
        api_key=settings.api_key,
        http_options=types.HttpOptions(
            timeout=int(settings.timeout_seconds * 1_000),
            retry_options=types.HttpRetryOptions(attempts=1),
        ),
    )


def _gemini_response_schema() -> dict[str, object]:
    schema = GMDecision.model_json_schema()
    # Gemini does not enforce string length or defaults. Pydantic validates the original schema.
    for name in ("narrative", "ending", "choices"):
        property_schema = schema["properties"][name]
        property_schema.pop("minLength", None)
        property_schema.pop("default", None)
        for alternative in property_schema.get("anyOf", []):
            alternative.pop("minLength", None)
    return schema


def create_gemini_transport(client: genai.Client, model: str) -> GMTransport:
    response_schema = _gemini_response_schema()

    async def generate(system_instruction: str, context_json: str) -> str:
        response = await client.aio.models.generate_content(
            model=model,
            contents=context_json,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_json_schema=response_schema,
                max_output_tokens=2048,
            ),
        )
        return response.text or ""

    return generate
