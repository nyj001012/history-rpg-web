from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request

from .game_engine import CHAPTERS, SessionEnded
from .schemas import Error, GMDecision, StartRequest, StartResponse, TurnRequest, TurnResponse
from .store import SessionNotFound, SessionStore


def health() -> dict[str, str]:
    return {"status": "ok"}


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(server: FastAPI) -> AsyncIterator[None]:
        server.state.game_sessions = SessionStore()
        yield

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
        try:
            async with store.locked(body.session_id) as session:
                session.require_active()
                decision = GMDecision(
                    narrative="광장에 잠시 정적이 흐릅니다. 사람들은 한 걸음 물러서고 당신 앞에 길이 열립니다.",
                    tendency="moderate",
                    trust_delta=0,
                    scene_id=8,
                )
                return session.apply_decision(body.player_input, decision)
        except SessionNotFound:
            raise HTTPException(status_code=404, detail="게임 세션을 찾을 수 없습니다.") from None
        except SessionEnded:
            raise HTTPException(status_code=409, detail="이미 종료된 게임 세션입니다.") from None

    return server


app = create_app()
