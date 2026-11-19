from fastapi import FastAPI

app = FastAPI(title="대체역사 시뮬레이터")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
