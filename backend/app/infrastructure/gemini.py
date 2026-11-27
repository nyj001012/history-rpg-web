import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

import httpx
from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from ..application.gm_turn import GMProviderError, GMTurnContext
from ..config import GeminiSettings
from ..schemas import GMDecision
from .gemini_prompts import GM_SYSTEM_INSTRUCTION, serialize_context


GMTransport = Callable[[str, str], Awaitable[str]]
_TRANSIENT_STATUS = {408, 429, 500, 502, 503, 504}


@dataclass(frozen=True)
class GeminiProvider:
    transport: GMTransport
    timeout_seconds: float

    async def make_decision(self, context: GMTurnContext) -> GMDecision:
        context_json = serialize_context(context)
        try:
            async with asyncio.timeout(self.timeout_seconds):
                response_json = await self.transport(GM_SYSTEM_INSTRUCTION, context_json)
            return GMDecision.model_validate_json(response_json)
        except (
            ValidationError,
            TimeoutError,
            ConnectionError,
            httpx.TransportError,
            errors.APIError,
        ) as error:
            raise _translate_provider_error(error) from error


def _translate_provider_error(error: Exception) -> GMProviderError:
    if isinstance(error, ValidationError):
        return GMProviderError("invalid_output")
    if isinstance(error, errors.APIError):
        if error.code in _TRANSIENT_STATUS:
            return GMProviderError("transient_provider_error")
        return GMProviderError("provider_error", retryable=False)
    return GMProviderError("transport")


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
    # Gemini에 전달하는 스키마에서는 문자열 길이 제한과 기본값을 제외합니다.
    # 응답을 받으면 Pydantic으로 원래 스키마를 검증합니다.
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
