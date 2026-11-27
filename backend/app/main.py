from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request

from .application.gm_turn import GMProvider, GMTurnContext, get_gm_decision
from .config import GeminiSettings
from .game_engine import CHAPTERS, SessionEnded
from .infrastructure.gemini import (
    GMTransport,
    GeminiProvider,
    create_gemini_client,
    create_gemini_transport,
)
from .schemas.requests import StartRequest, TurnRequest
from .schemas.responses import Error, StartResponse, TurnResponse
from .store import SessionNotFound, SessionStore


def health() -> dict[str, str]:
    return {"status": "ok"}


def create_app(gm_transport: GMTransport | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(server: FastAPI) -> AsyncIterator[None]:
        settings = GeminiSettings.from_environment()
        server.state.game_sessions = SessionStore()
        if gm_transport is not None or not settings.api_key:
            server.state.gm_provider = (
                GeminiProvider(gm_transport, settings.timeout_seconds)
                if gm_transport is not None
                else None
            )
            yield
            return

        client = create_gemini_client(settings)
        try:
            async with client.aio:
                transport = create_gemini_transport(client, settings.model)
                server.state.gm_provider = GeminiProvider(
                    transport, settings.timeout_seconds
                )
                yield
        finally:
            client.close()

    server = FastAPI(title="대체역사 시뮬레이터", lifespan=lifespan)
    server.add_api_route("/api/health", health, methods=["GET"])

    @server.post(
        "/api/game/start",
        response_model=StartResponse,
        responses={404: {"model": Error, "description": "지원되지 않는 챕터"}},
        operation_id="startGame",
    )
    async def start_game(body: StartRequest, request: Request) -> StartResponse:
        chapter = CHAPTERS.get(body.chapter_id)
        if chapter is None:
            raise HTTPException(status_code=404, detail="지원하지 않는 챕터입니다.")
        store: SessionStore = request.app.state.game_sessions
        return store.create(chapter).opening_response()

    @server.post(
        "/api/game/turn",
        response_model=TurnResponse,
        responses={
            404: {"model": Error, "description": "존재하지 않는 세션"},
            409: {"model": Error, "description": "이미 종료된 세션"},
        },
        operation_id="playTurn",
    )
    async def play_turn(body: TurnRequest, request: Request) -> TurnResponse:
        store: SessionStore = request.app.state.game_sessions
        provider: GMProvider | None = request.app.state.gm_provider
        try:
            async with store.locked(body.session_id) as session:
                session.require_active()
                decision = await get_gm_decision(
                    GMTurnContext(
                        chapter_id=session.chapter.chapter_id,
                        turn=session.turn,
                        current_trust=session.current_trust,
                        scene_id=session.scene_id,
                        recent_history=tuple(session.recent_history),
                        player_input=body.player_input,
                    ),
                    provider,
                )
                return session.apply_decision(body.player_input, decision)
        except SessionNotFound:
            raise HTTPException(status_code=404, detail="게임 세션을 찾을 수 없습니다.") from None
        except SessionEnded:
            raise HTTPException(status_code=409, detail="이미 종료된 게임 세션입니다.") from None

    return server


app = create_app()
