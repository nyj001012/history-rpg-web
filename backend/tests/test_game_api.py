import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from threading import Event

import pytest
from fastapi.testclient import TestClient

from app import main


CHAPTER = 'ch1_revolution'
START = '/api/game/start'
TURN = '/api/game/turn'


def decision(**overrides):
    return {
        'narrative': '군중이 잠시 물러납니다.',
        'tendency': 'moderate',
        'trust_delta': 0,
        'scene_id': 2,
        'ending': None,
        'choices': ['광장을 살핀다'],
        **overrides,
    }


class FakeGemini:
    def __init__(self, *results):
        self.results = iter(results)
        self.calls = []

    async def __call__(self, system_instruction, context_json):
        self.calls.append((system_instruction, json.loads(context_json)))
        result = next(self.results)
        if isinstance(result, Exception):
            raise result
        return json.dumps(result, ensure_ascii=False)


def start(client):
    response = client.post(START, json={'chapter_id': CHAPTER})
    assert response.status_code == 200
    return response.json()


def turn(client, session_id, player_input='군중과 이야기를 나눈다'):
    response = client.post(TURN, json={'session_id': session_id, 'player_input': player_input})
    assert response.status_code == 200
    return response.json()


def test_be_01_start_and_first_turn():
    result = decision(tendency='radical', trust_delta=7)
    gm = FakeGemini(result)
    with TestClient(main.create_app(gm_transport=gm)) as client:
        opening = start(client)
        assert gm.calls == []
        session_id = opening['session_id']
        assert type(session_id) is str and session_id
        assert type(opening['narrative']) is str and opening['narrative'].strip()
        assert isinstance(opening['choices'], list)
        assert len(opening['choices']) <= 4
        assert all(type(choice) is str for choice in opening['choices'])
        assert opening == {
            'session_id': session_id,
            'chapter_id': CHAPTER,
            'turn': 1,
            'narrative': opening['narrative'],
            'current_trust': 50,
            'scene_id': 1,
            'asset_key': f'{CHAPTER}_scene_01',
            'choices': opening['choices'],
        }
        action = '광장을 둘러본다'
        response = turn(client, session_id, action)

    assert response == {
        **result,
        'session_id': session_id,
        'chapter_id': CHAPTER,
        'turn': 2,
        'current_trust': 57,
        'asset_key': f'{CHAPTER}_scene_02',
    }
    assert all(type(response[field]) is int for field in ('turn', 'current_trust', 'trust_delta', 'scene_id'))
    assert len(gm.calls) == 1
    system, context = gm.calls[0]
    assert isinstance(system, str) and system.strip()
    assert {name: context[name] for name in ('chapter_id', 'turn', 'current_trust', 'scene_id', 'recent_history', 'player_input')} == {
        'chapter_id': CHAPTER,
        'turn': 1,
        'current_trust': 50,
        'scene_id': 1,
        'recent_history': [],
        'player_input': action,
    }


@pytest.mark.parametrize('error', [TimeoutError, ConnectionError])
def test_be_02_transient_errors_fall_back_after_three_calls(error):
    gm = FakeGemini(error(), error(), error(), decision())
    with TestClient(main.create_app(gm_transport=gm)) as client:
        session_id = start(client)['session_id']
        action = '광장으로 들어간다'
        response = turn(client, session_id, action)
        assert len(gm.calls) == 3
        assert gm.calls[0] == gm.calls[1] == gm.calls[2]
        assert gm.calls[0][1]['turn'] == 1
        assert gm.calls[0][1]['recent_history'] == []
        assert isinstance(response['narrative'], str) and response['narrative'].strip()
        assert response == {
            'session_id': session_id,
            'chapter_id': CHAPTER,
            'turn': 2,
            'narrative': response['narrative'],
            'tendency': 'moderate',
            'trust_delta': 0,
            'current_trust': 50,
            'scene_id': 8,
            'asset_key': f'{CHAPTER}_scene_08',
            'ending': None,
            'choices': [],
        }
        assert turn(client, session_id)['turn'] == 3

    context = gm.calls[-1][1]
    assert context['turn'] == 2
    assert len(context['recent_history']) == 1
    assert context['recent_history'][0]['player_input'] == action


@pytest.mark.parametrize('failures', [1, 2])
def test_be_03_successful_retry_applies_turn_once(failures):
    result = decision(trust_delta=8)
    gm = FakeGemini(*(ConnectionError() for _ in range(failures)), result, decision())
    with TestClient(main.create_app(gm_transport=gm)) as client:
        session_id = start(client)['session_id']
        action = '통행 허가를 요청한다'
        response = turn(client, session_id, action)
        assert len(gm.calls) == failures + 1
        assert all(call == gm.calls[0] for call in gm.calls)
        assert response['turn'] == 2
        assert response['narrative'] == result['narrative']
        assert response['choices'] == result['choices']
        assert response['current_trust'] == 58
        assert turn(client, session_id)['turn'] == 3

    context = gm.calls[-1][1]
    assert context['turn'] == 2 and context['current_trust'] == 58
    assert len(context['recent_history']) == 1
    assert context['recent_history'][0]['player_input'] == action


def test_be_06_rejects_unsupported_chapter_and_ended_session():
    gm = FakeGemini(decision(ending='협상이 끝났다'))
    with TestClient(main.create_app(gm_transport=gm)) as client:
        assert client.post(START, json={'chapter_id': 'unknown'}).status_code == 404
        assert gm.calls == []
        session_id = start(client)['session_id']
        assert turn(client, session_id)['ending'] == '협상이 끝났다'
        for _ in range(2):
            response = client.post(TURN, json={'session_id': session_id, 'player_input': '다시 시작한다'})
            assert response.status_code == 409
        assert len(gm.calls) == 1


def test_be_07_clamps_upper_trust_and_allows_model_ending():
    gm = FakeGemini(decision(trust_delta=25), decision(trust_delta=20), decision(trust_delta=25, ending='협상이 끝났다'))
    with TestClient(main.create_app(gm_transport=gm)) as client:
        session_id = start(client)['session_id']
        turn(client, session_id)
        assert turn(client, session_id)['current_trust'] == 95
        terminal = turn(client, session_id)

    assert terminal['current_trust'] == 100
    assert terminal['trust_delta'] == 5
    assert terminal['ending'] == '협상이 끝났다'
    assert terminal['choices'] == []


@pytest.mark.parametrize('terminal_kind', ['depletion', 'limit', 'fallback'])
def test_be_07_terminal_precedence_at_turn_limit(terminal_kind):
    steps = [decision() for _ in range(18)]
    if terminal_kind == 'depletion':
        steps[0] = decision(trust_delta=-30)
        steps.append(decision(trust_delta=-30, ending='협상이 끝났다'))
    elif terminal_kind == 'limit':
        steps.append(decision(ending='협상이 끝났다'))
    else:
        steps.extend(TimeoutError() for _ in range(3))

    gm = FakeGemini(*steps)
    with TestClient(main.create_app(gm_transport=gm)) as client:
        session_id = start(client)['session_id']
        for expected_turn in range(2, 20):
            response = turn(client, session_id, f'행동 {expected_turn}')
            assert response['turn'] == expected_turn
            assert response['ending'] is None
        terminal = turn(client, session_id, '마지막 행동')

    assert terminal['turn'] == 20
    assert terminal['choices'] == []
    assert terminal['ending'] == ('trust_depleted' if terminal_kind == 'depletion' else 'turn_limit_reached')
    if terminal_kind == 'depletion':
        assert terminal['current_trust'] == 0
        assert terminal['trust_delta'] == -20
    else:
        assert terminal['current_trust'] == 50
        assert terminal['trust_delta'] == 0
    if terminal_kind == 'fallback':
        assert terminal['scene_id'] == 8
    context = gm.calls[-1][1]
    assert [entry['player_input'] for entry in context['recent_history']] == [f'행동 {number}' for number in range(16, 20)]


def test_be_08_serializes_same_session_without_blocking_another():
    first_entered = Event()
    release_first = Event()
    duplicate_submitted = Event()
    contexts = []
    action = '같은 행동을 한다'

    async def gm(system_instruction, context_json):
        context = json.loads(context_json)
        contexts.append(context)
        if len(contexts) == 1:
            first_entered.set()
            assert await asyncio.to_thread(release_first.wait, 10)
        return json.dumps(decision(trust_delta=4))

    def duplicate_request(client, session_id):
        duplicate_submitted.set()
        return turn(client, session_id, action)

    with TestClient(main.create_app(gm_transport=gm)) as client, ThreadPoolExecutor(max_workers=3) as executor:
        first_id = start(client)['session_id']
        other_id = start(client)['session_id']
        assert first_id != other_id
        first = executor.submit(turn, client, first_id, action)
        try:
            assert first_entered.wait(5)
            duplicate = executor.submit(duplicate_request, client, first_id)
            assert duplicate_submitted.wait(5)
            other = executor.submit(turn, client, other_id, '다른 세션의 행동을 한다')
            other_response = other.result(timeout=5)
            assert not first.done()
            assert not duplicate.done()
            assert [item['player_input'] for item in contexts] == [action, '다른 세션의 행동을 한다']
        finally:
            release_first.set()
        first_response = first.result(timeout=5)
        duplicate_response = duplicate.result(timeout=5)

    assert (first_response['turn'], duplicate_response['turn'], other_response['turn']) == (2, 3, 2)
    assert (first_response['current_trust'], duplicate_response['current_trust'], other_response['current_trust']) == (54, 58, 54)
    assert contexts[1]['recent_history'] == []
    assert contexts[2]['turn'] == 2
    assert [record['player_input'] for record in contexts[2]['recent_history']] == [action]
