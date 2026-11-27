from fastapi.testclient import TestClient

from app.main import create_app


def test_game_session_can_start_and_finish_without_gemini(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with TestClient(create_app()) as client:
        start = client.post("/api/game/start", json={"chapter_id": "ch1_revolution"})
        assert start.status_code == 200
        opening = start.json()
        assert (opening["turn"], opening["current_trust"], opening["asset_key"]) == (
            1, 50, "ch1_revolution_scene_01"
        )

        action = {"session_id": opening["session_id"], "player_input": "광장을 살핀다"}
        for expected_turn in range(2, 21):
            response = client.post("/api/game/turn", json=action)
            assert response.status_code == 200
            result = response.json()
            assert (result["turn"], result["current_trust"], result["asset_key"]) == (
                expected_turn, 50, "ch1_revolution_scene_08"
            )
            expected_ending = "turn_limit_reached" if expected_turn == 20 else None
            assert result["ending"] == expected_ending

        assert client.post("/api/game/turn", json=action).status_code == 409
