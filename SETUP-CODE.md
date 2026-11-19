# 작업 명세 4-1 ~ 4-3

아래 코드는 프로젝트에 작성된 파일의 전체 내용이다. 같은 구성을 빈 작업 디렉터리에 재현하려면 Bash에서 아래 명령으로 폴더를 만든 뒤, 각 블록을 표시된 경로에 저장한다.

```bash
mkdir -p history-rpg-web/{.github/workflows,backend/app,backend/tests,frontend/src,frontend/tests,k8s}
cd history-rpg-web
touch backend/app/__init__.py k8s/.gitkeep
```

이후 아래의 `README.md`에 있는 로컬 실행 명령을 사용한다.

## `.github/workflows/main.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  backend-test:
    name: Backend Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
          cache-dependency-path: backend/requirements.txt
      - run: python -m pip install -r requirements.txt
      - run: python -m pytest

  frontend-test:
    name: Frontend Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Generate lockfile when absent
        run: |
          if [ ! -f package-lock.json ]; then
            npm install --package-lock-only
          fi
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e

  deploy-placeholder:
    name: Deploy Placeholder
    needs: [backend-test, frontend-test]
    if: ${{ needs.backend-test.result == 'success' && needs.frontend-test.result == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to Vultr K8s via ArgoCD"
```

## `.gitignore`

```text
.env
.venv/
__pycache__/
.pytest_cache/
node_modules/
dist/
playwright-report/
test-results/
```

## `README.md`

````markdown
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

GitHub Actions는 `main`에 대한 push와 pull request에서 두 테스트 작업을 실행한다. 둘 다 성공하면 배포 자리표시 작업이 실행된다. 이 워크플로를 사용하려면 `history-rpg-web`을 GitHub 저장소의 루트로 사용한다. `k8s/`는 VKE 및 ArgoCD 매니페스트를 추가할 위치다.

[설치 명령과 전체 초기 코드](SETUP-CODE.md)
````

## `backend/app/__init__.py`

```python
```

## `backend/app/main.py`

```python
from fastapi import FastAPI

app = FastAPI(title="대체역사 시뮬레이터")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

## `backend/requirements.txt`

```text
fastapi>=0.115,<1
uvicorn>=0.34,<1
sqlalchemy>=2.0,<3
alembic>=1.14,<2
redis>=5.2,<7
PyMySQL>=1.1,<2
pytest>=8.3,<9
pytest-mock>=3.14,<4
httpx>=0.28,<1
```

## `backend/tests/test_health.py`

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok() -> None:
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

## `docker-compose.yml`

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: history_rpg
      MYSQL_USER: history
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-history-dev}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-history-root-dev}
    ports:
      - "127.0.0.1:3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
  redis:
    image: redis:latest
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

## `frontend/index.html`

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>대체역사 시뮬레이터</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## `frontend/package.json`

```json
{
  "name": "history-rpg-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=18" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "framer-motion": "^11.18.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@playwright/test": "~1.51.1",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "vite": "^6.3.6"
  }
}
```

## `frontend/playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests',
  use: { baseURL, ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
```

## `frontend/postcss.config.cjs`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## `frontend/src/main.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## `frontend/src/main.jsx`

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useReducedMotion } from 'framer-motion';
import { create } from 'zustand';
import './main.css';

const useConnection = create((set) => ({
  status: 'idle',
  async check() {
    set({ status: 'pending' });
    try {
      const response = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      const data = response.ok ? await response.json() : null;
      set({ status: data?.status === 'ok' ? 'online' : 'offline' });
    } catch {
      set({ status: 'offline' });
    }
  },
}));

const messages = {
  idle: '아직 연결을 확인하지 않았습니다.',
  pending: '연결을 확인하는 중입니다.',
  online: '서버에 연결되었습니다.',
  offline: '서버에 연결할 수 없습니다.',
};

function App() {
  const status = useConnection((state) => state.status);
  const check = useConnection((state) => state.check);
  const reduceMotion = useReducedMotion();

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-6 py-12 text-zinc-100">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl border-t border-amber-400/60 py-8"
      >
        <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-5xl">대체역사 시뮬레이터</h1>
        <button
          type="button"
          onClick={check}
          disabled={status === 'pending'}
          className="rounded bg-amber-300 px-4 py-2 font-medium text-zinc-950 hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 disabled:opacity-70"
        >
          서버 연결 확인
        </button>
        <p role="status" className="mt-4 text-zinc-300">{messages[status]}</p>
      </motion.section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
```

## `frontend/tailwind.config.cjs`

```js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
};
```

## `frontend/tests/connection.spec.ts`

```ts
import { expect, test } from '@playwright/test';

test('shows a successful server connection', async ({ page }) => {
  await page.route('**/api/health', (route) => route.fulfill({ json: { status: 'ok' } }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '대체역사 시뮬레이터' })).toBeVisible();
  await page.getByRole('button', { name: '서버 연결 확인' }).click();
  await expect(page.getByRole('status')).toHaveText('서버에 연결되었습니다.');
});

test('reports an unavailable server', async ({ page }) => {
  await page.route('**/api/health', (route) => route.fulfill({ status: 503 }));
  await page.goto('/');
  await page.getByRole('button', { name: '서버 연결 확인' }).click();
  await expect(page.getByRole('status')).toHaveText('서버에 연결할 수 없습니다.');
});
```

## `frontend/vite.config.js`

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': process.env.API_TARGET ?? 'http://127.0.0.1:8000',
    },
  },
});
```

## `k8s/.gitkeep`

```text
```
