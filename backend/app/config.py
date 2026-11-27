from dataclasses import dataclass, field
from os import getenv


@dataclass(frozen=True)
class GeminiSettings:
    api_key: str = field(repr=False)
    model: str
    timeout_seconds: float = 10.0

    @classmethod
    def from_environment(cls) -> "GeminiSettings":
        return cls(
            api_key=getenv("GEMINI_API_KEY", "").strip(),
            model=getenv("GEMINI_MODEL", "").strip() or "gemini-3.8-flash",
        )
