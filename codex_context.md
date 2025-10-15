## 개요
- myStorage는 개인 소장품을 관리하는 풀스택 애플리케이션으로, 공개 조회와 소유자 전용 관리 기능을 모두 제공한다.
- PostgreSQL과 MongoDB를 결합한 하이브리드 데이터 아키텍처, FastAPI 기반의 백엔드, Next.js 15(app router) 기반의 프론트엔드, LangChain/DeepL 연동 AI 기능, Playwright 웹 스크래핑을 핵심 구성요소로 사용한다.
- 주요 문서는 `README.md`(프로젝트 개요 및 셋업), `docs/ARCHITECTURE.md`(시스템 구조), `docs/features/*`(컬렉션·AI·스크래핑·필드매핑 세부 설명), `docs/guides/*`(AI 키 발급, 인증 설정, 예시 컬렉션)으로 분리되어 있다.

## 백엔드 핵심
- `backend/app/main.py`에서 FastAPI 애플리케이션을 기동하며, lifespan 훅으로 PostgreSQL 테이블 생성과 MongoDB 연결/종료를 처리하고 CORS를 허용한다.
- `core/config.py`는 환경변수 기반 설정(데이터베이스, OAuth, AI 키, DeepL 등)을 `Settings` 클래스로 관리하고 `DATABASE_URL`·`MONGO_URL` 접근자를 제공한다.
- `core/auth.py`는 JWT 생성·검증, 소유자 권한 확인, 선택적 인증 의존성을 구현해 관리자 전용 엔드포인트를 보호한다.
- API 라우터
  - `api/collections.py`: 컬렉션 조회/생성/수정/삭제를 제공하며, owner 여부에 따라 비공개 컬렉션 노출을 제어한다.
  - `api/items.py`: MongoDB에 저장된 아이템 목록 페이징/검색/정렬, 단건 조회, CRUD 엔드포인트를 제공한다.
  - `api/ai.py`: AI 필드 추천, 슬러그 번역, AI 모델 목록/설정 저장을 담당한다.
  - `api/scraper.py`: 필드 매핑 저장·조회, 단일 URL 스크래핑, CSV 일괄 스크래핑(SSE 스트리밍), 차단 시 남은 URL 다운로드를 처리한다.
- 서비스 레이어
  - `services/collection/collection_service.py`: 컬렉션 생성 시 중복 검사, DeepL 기반 슬러그 자동 생성, MongoDB 컬렉션 생성 및 인덱스 설정, 삭제 시 MongoDB 컬렉션 정리 등을 수행한다.
  - `services/item/item_service.py`: PostgreSQL에서 인증받은 MongoDB 컬렉션명을 가져와 SQL Injection을 방지하고, 검색/정렬용 쿼리를 구성하며, 타이틀 자동 보정과 ObjectId 유효성 검사를 포함한다.
  - `services/ai/field_suggestion_service.py`: LangChain(OpenAI/Gemini) 호출로 필드 추천을 생성하고 JSON 응답을 검증한다. 모델 미설정 시 에러를 발생시켜 관리자 설정을 강제한다.
  - `services/ai/translation_service.py`: DeepL API로 한글 이름을 슬러그로 번역하고, 실패 시 해시 기반 fallback을 제공한다.
  - `services/scraper/web_scraper.py`: Playwright 기반으로 HTML을 가져와 Open Graph/메타/JSON-LD를 파싱하며, 교보문고·알라딘 전용 셀렉터를 제공하고 제목 누락 시 차단으로 간주한다.
  - `services/scraper/csv_processor.py`: 업로드된 CSV를 URL 목록으로 파싱, 저장된 필드 매핑을 적용, SSE 이벤트(progress/error/blocked/complete)를 생성하고, 차단 시 남은 URL을 CSV로 저장해 토큰을 발급한다.
- 모델/스키마: `models/collection.py`와 `models/user_settings.py`, `schemas` 디렉터리의 Pydantic 모델이 FastAPI 응답/입력 검증을 담당한다.
- Alembic 마이그레이션(001~003)은 필드 매핑 추가, user_settings 테이블 생성, 컬렉션 공개여부 컬럼 추가를 기록한다.
- 운영 스크립트: `scripts/backup_db.sh`·`restore_db.sh`는 Docker 컨테이너 내 pg_dump/mongodump를 자동화하고 압축·정리 옵션을 제공하며, `update_series.py`는 특정 키워드 기반 시리즈 일괄 업데이트 CLI를 제공한다.

## 프론트엔드 핵심
- `app/layout.tsx`는 GoogleOAuthProvider와 AuthProvider로 전체 앱을 감싸고 `globals.css` 스타일을 적용한다.
- 퍼블릭 영역
  - `app/page.tsx`: 서버 컴포넌트로 컬렉션 목록을 SSR 렌더링.
  - `app/collections/[slug]/page.tsx`: 컬렉션 상세, 검색/정렬, 그리드/리스트 전환, 상세 모달을 제공하고 서버/클라이언트 상태를 조합한다.
- 관리자 영역
  - `app/admin/page.tsx`: Google OAuth 로그인 UI, 로그인 후 관리자 카드, AI 모델 설정 모달을 제공한다.
  - `app/admin/collections/page.tsx`: 컬렉션 목록, 생성/수정/삭제, 아이콘/필드 편집 모달을 다룬다.
  - `app/admin/collections/[slug]/items/page.tsx`: 아이템 페이징/검색/정렬, 선택 삭제, 단건 모달, CSV 일괄 등록 모달을 묶는다.
- Next API Routes(`app/api/*`)는 내부 백엔드로 요청을 프록시하여 서버사이드 환경에서도 동일한 엔드포인트를 활용할 수 있게 한다.
- `lib/api.ts`는 클라이언트와 서버에서 동일한 API 호출 함수(컬렉션/아이템 CRUD 등)를 정의하고, 실행 환경에 따라 API URL과 Authorization 헤더를 분기한다.
- 주요 컴포넌트
  - `CollectionModal`: 고정 title 필드, AI 필드 추천, DeepL 슬러그 번역, 이모지 선택, 고급 옵션을 포함한다.
  - `FieldDefinitionEditor`: drag&drop 기반 필드 순서 변경과 정렬/검색 표시 여부 플래그를 편집한다.
  - `AIFieldSuggestion`: 저장된 AI 모델 설정을 사용해 필드 추천을 요청하고 중복 필드를 필터링한다.
  - `ItemModal`: 수동 입력/URL 스크래핑 모드를 전환하고, 스크래핑 결과를 `FieldMappingModal`로 매핑 후 저장한다.
  - `BulkImportModal`: CSV 템플릿 다운로드, 저장된 매핑 확인, SSE 실시간 진행 표시, 차단 시 토큰 다운로드를 지원한다.
  - `MappingConfirmationModal`: 저장된 매핑과 현재 필드 정의를 비교하여 불일치 경고 후 사용/미사용 선택을 받는다.
  - `ModelSelectionModal`: 백엔드에서 제공한 모델 목록을 기반으로 텍스트/비전 모델을 선택하고 저장한다.
- `hooks/useAISettings.ts`: 모델 목록/현재 설정을 로딩, `saveSettings`로 DB에 저장, 오류 상태를 관리한다.
- `contexts/AuthContext`는 로컬 스토리지에 토큰과 사용자 정보를 저장/삭제하고, 로그인 상태를 전역으로 제공해 관리자 화면의 접근을 제어한다.

## 인프라 및 실행
- `docker-compose.yml`은 Postgres(pgvector), MongoDB, FastAPI 백엔드, Next.js 프론트엔드 컨테이너를 정의하고 환경변수와 볼륨을 연결한다.
- `Dockerfile.backend`는 uv로 Python 의존성을 설치하고 Playwright 브라우저와 deps를 설치한 뒤 Uvicorn 실행을 기본 커맨드로 지정한다.
- `pyproject.toml`은 FastAPI, SQLAlchemy, Motor, LangChain, Playwright 등 백엔드 런타임 의존성을 선언한다.
- `scripts/deploy.sh`·`migrate.sh`·`reset_database.sh`는 EC2 배포, 알레빅 마이그레이션 실행, 데이터 초기화를 순차적으로 자동화한다.

## 데이터 및 AI 흐름
- 컬렉션 메타데이터와 필드 정의/매핑은 PostgreSQL `collections` 테이블의 JSONB 컬럼에 저장되며, 실제 아이템 문서는 MongoDB `items_*` 컬렉션에 저장된다.
- AI 모델 설정은 `user_settings` 테이블에 `"provider/model_id"` 형식으로 영구 저장되어 관리자 여러 환경에서 동일한 모델을 사용하도록 지원한다.
- AI 필드 추천 호출 시 LangChain이 설정된 모델로 JSON 응답을 생성하고, 백엔드는 파싱 오류에 대비해 코드블록 제거 및 예외 처리를 수행한다.
- DeepL을 통한 슬러그 번역은 slug 안전성을 검증하고, 빈 결과에는 해시 fallback을 적용한다.
- Playwright 스크래핑은 OG 메타, JSON-LD, 사이트별 선택자를 조합해 제목·저자·가격·이미지 등 메타데이터를 구성하고, 제목 누락을 차단 시나리오로 간주해 CSV 스트리밍을 조기 종료한다.
- CSV 일괄 등록은 SSE 이벤트(progress/error_item/blocked/complete)로 프론트엔드에 진행 상황을 전달하고, 스크래핑 실패 시 CSV 데이터만으로 아이템을 생성하는 fallback을 제공한다.

## 시작 전 체크리스트
1. `.env`에 PostgreSQL/MongoDB 자격증명, `SECRET_KEY`, 소유자 이메일, Google OAuth 클라이언트 ID/Secret, 필요 시 `OPENAI_API_KEY`·`GEMINI_API_KEY`·`DEEPL_API_KEY`를 설정한다.
2. Docker 환경에서 `docker-compose up --build`로 전체 스택을 실행하고, 로컬에서 Playwright를 사용한다면 `uv run playwright install-deps`를 먼저 수행한다.
