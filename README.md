# 대체역사 시뮬레이터

React/Vite와 FastAPI로 분리한 웹 게임 모노레포. 첫 단계에서는 브라우저에서 API 연결을 확인할 수 있다. MySQL과 Redis는 로컬 개발 서비스로 준비되어 있으며, 인증, 저장, Gemini 게임 진행과 엔딩 아카이브는 후속 구현 범위다.

## 로컬 실행

Docker Compose v2, Python 3.11, Node.js 18이 필요하다. 아래 명령은 Bash 기준이다.

프로젝트 루트에서 데이터 서비스를 시작한다. 기본 개발 계정은 `history`, 데이터베이스는 `history_rpg`다. 비밀번호는 `MYSQL_PASSWORD`와 `MYSQL_ROOT_PASSWORD` 환경 변수로 변경할 수 있다. 두 서비스는 로컬 루프백에만 연결된다.

```bash
docker compose up -d
docker compose ps
```

첫 번째 터미널에서 FastAPI를 실행한다.

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

두 번째 터미널에서 프런트엔드를 실행한다. 생성된 `package-lock.json`을 저장소에 커밋하면 이후 로컬과 CI에서 같은 의존성 해석 결과를 사용할 수 있다.

```bash
cd frontend
if [ ! -f package-lock.json ]; then npm install --package-lock-only; fi
npm ci
npm run dev
```

브라우저에서 `http://localhost:5173`을 열고 **서버 연결 확인**을 누른다. Vite가 `/api` 요청을 FastAPI의 기본 포트 8000으로 전달한다. API 위치를 바꾸려면 프런트엔드 실행 시 `API_TARGET`을 지정한다.

## 테스트와 CI

```bash
# backend 폴더 및 가상 환경에서 실행
python -m pytest

# frontend 폴더에서 실행
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
```

백엔드 테스트는 실제 FastAPI 헬스 엔드포인트를 호출한다. Playwright는 API 응답을 모의해 연결 성공과 실패 화면을 검증한다. 실제 프런트엔드와 백엔드 연결은 두 서버를 함께 실행해 확인할 수 있다.

개발 작업은 `dev`에서 분기하고 PR로 `dev`에 합친다. 릴리즈할 때 `dev`에서 `main`으로 PR을 열어 병합한다. GitHub Actions는 두 브랜치의 push와 PR에서 테스트를 실행한다. `main`의 push에서 두 테스트가 통과하면 배포 자리표시 작업이 실행된다. 이 워크플로를 사용하려면 `history-rpg-web`을 GitHub 저장소의 루트로 사용한다. `k8s/`는 VKE 및 ArgoCD 매니페스트를 추가할 위치다.

[설치 명령과 전체 초기 코드](SETUP-CODE.md)
