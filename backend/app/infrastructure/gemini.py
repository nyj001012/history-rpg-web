import asyncio
from collections.abc import Awaitable, Callable

import httpx
from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from ..application.gm_turn import GMProvider, GMProviderError, GMTurnContext
from ..config import GeminiSettings
from ..schemas import GMDecision
from .gemini_prompts import GM_SYSTEM_INSTRUCTION, serialize_context


GMTransport = Callable[[str, str], Awaitable[str]]
_TRANSIENT_STATUS = {408, 429, 500, 502, 503, 504}


def create_gemini_provider(transport: GMTransport, timeout_seconds: float) -> GMProvider:
    async def decide(context: GMTurnContext) -> GMDecision:
        context_json = serialize_context(context)
        try:
            async with asyncio.timeout(timeout_seconds):
                response_json = await transport(GM_SYSTEM_INSTRUCTION, context_json)
            return GMDecision.model_validate_json(response_json)
        except ValidationError as error:
            raise GMProviderError("invalid_output") from error
        except (TimeoutError, ConnectionError, httpx.TransportError) as error:
            raise GMProviderError("transport") from error
        except errors.APIError as error:
            if error.code in _TRANSIENT_STATUS:
                raise GMProviderError("transient_provider_error") from error
            raise GMProviderError("provider_error", retryable=False) from error

    return decide


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
