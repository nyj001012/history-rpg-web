# 대체역사 시뮬레이터

React/Vite와 FastAPI로 분리한 웹 게임 모노레포. 첫 단계에서는 브라우저에서 API 연결을 확인할 수 있다. MariaDB와 Redis는 로컬 개발 서비스로 준비되어 있으며, 인증, 저장, Gemini 게임 진행과 엔딩 아카이브는 후속 구현 범위다.

## 로컬 실행

Docker Compose v2, Python 3.11, Node.js 18이 필요하다. 아래 명령은 Bash 기준이다.

프로젝트 루트에서 데이터 서비스를 시작한다. 기본 개발 계정은 `history`, 데이터베이스는 `history_rpg`다. 비밀번호는 `MARIADB_PASSWORD`와 `MARIADB_ROOT_PASSWORD` 환경 변수로 설정한다. 두 서비스는 로컬 루프백에만 연결된다.

```bash
docker compose up -d --wait
docker compose ps
```

첫 번째 터미널에서 FastAPI를 실행한다.

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
export DATABASE_URL='mariadb+pymysql://history:history-dev@127.0.0.1:3306/history_rpg'
python -m alembic upgrade head
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

## 기존 MySQL 데이터 이전

MariaDB는 공식 `mariadb:latest` 이미지와 새 `mariadb_data` 볼륨을 사용한다. 기존 MySQL의 `mysql_data` 볼륨은 보존한다. 기존 데이터가 필요 없다면 사용 중인 MySQL 컨테이너를 중지한 뒤 위 로컬 실행 절차로 새 스키마를 만들면 된다.

데이터를 옮길 때는 MySQL에 쓰는 애플리케이션을 먼저 멈춘다. 기존 MySQL과 같은 Compose 프로젝트 이름을 사용하는 이전 체크아웃에서 애플리케이션 데이터베이스만 덤프한다. 아래 예시의 덤프 경로는 접근 권한이 제한된 프로젝트 외부 경로로 바꾼다.

```bash
umask 077
docker compose exec -T mysql sh -c '
  exec mysqldump -uroot --password="$MYSQL_ROOT_PASSWORD" --single-transaction \
    --set-gtid-purged=OFF --no-tablespaces --hex-blob "$MYSQL_DATABASE"
' > /path/to/backup/history_rpg.sql && docker compose stop mysql
```

MariaDB의 새 볼륨을 시작하고, **Alembic으로 미리 테이블을 만들기 전에** 덤프를 복원한다. 스키마와 Alembic 버전 테이블도 덤프에 포함된다.

```bash
docker compose up -d --wait mariadb
docker compose exec -T mariadb sh -c '
  exec mariadb -uroot --password="$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"
' < /path/to/backup/history_rpg.sql
```

복원한 데이터베이스에 로컬 실행 절차의 `DATABASE_URL`을 지정하고 `python -m alembic upgrade head`를 실행한다. 회차, 세이브, 엔딩 행 수와 JSON 값이 일치하는지 확인할 때까지 기존 MySQL 볼륨과 덤프를 보관한다. 비밀번호를 바꿨다면 접속 URL에도 반영한다.

## 테스트와 CI

```bash
# backend 폴더 및 가상 환경에서 실행
python -m pytest

# frontend 폴더에서 실행
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
```

백엔드 테스트는 FastAPI 헬스 엔드포인트와 SQLite 스키마를 검증한다. CI는 별도의 MariaDB 컨테이너에서 초기 마이그레이션과 데이터 제약도 확인한다. Playwright는 API 응답을 모의해 연결 성공과 실패 화면을 검증한다. 실제 프런트엔드와 백엔드 연결은 두 서버를 함께 실행해 확인할 수 있다.

개발 작업은 `dev`에서 분기하고 PR로 `dev`에 합친다. 릴리즈할 때 `dev`에서 `main`으로 PR을 열어 병합한다. GitHub Actions는 두 브랜치의 push와 PR에서 테스트를 실행한다. `main`의 push에서 두 테스트가 통과하면 배포 자리표시 작업이 실행된다. 이 워크플로를 사용하려면 `history-rpg-web`을 GitHub 저장소의 루트로 사용한다. `k8s/`는 VKE 및 ArgoCD 매니페스트를 추가할 위치다.

[설치 명령과 전체 초기 코드](SETUP-CODE.md)
