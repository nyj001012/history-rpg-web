from asyncio import Lock
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from secrets import token_urlsafe

from .game_engine import ChapterConfig, GameSession


class SessionNotFound(Exception):
    pass


@dataclass
class _SessionEntry:
    session: GameSession
    lock: Lock = field(default_factory=Lock)


class SessionStore:
    def __init__(self) -> None:
        self._entries: dict[str, _SessionEntry] = {}

    def create(self, chapter: ChapterConfig) -> GameSession:
        session_id = token_urlsafe(32)
        while session_id in self._entries:
            session_id = token_urlsafe(32)
        session = GameSession(session_id, chapter)
        self._entries[session_id] = _SessionEntry(session)
        return session

    @asynccontextmanager
    async def locked(self, session_id: str) -> AsyncIterator[GameSession]:
        entry = self._entries.get(session_id)
        if entry is None:
            raise SessionNotFound
        async with entry.lock:
            yield entry.session
