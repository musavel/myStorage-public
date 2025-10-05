# 개발 진행 상황

## 프로젝트 개요
개인 소장품 관리 시스템 (도서, 보드게임 등)

---

## 📅 2025-10-05 (일) - 초기 구현
### Commit: 5e77acc (00:30)

#### 백엔드 구현
- ✅ PostgreSQL + pgVector 데이터베이스 설계
  - Collection, Book, BoardGame 테이블 (외래키 관계)
- ✅ RESTful API 구현
  - `/api/collections`, `/api/books`, `/api/board-games`
- ✅ Google OAuth 2.0 인증 시스템
  - JWT 토큰 기반 인증
  - 소유자 권한 검증 (`require_owner`)

#### 프론트엔드 구현
- ✅ Public 페이지 (조회 전용)
  - 메인: 컬렉션 카드 + 아이템 수 + 소유자 이름 개인화
  - 도서/보드게임 목록 페이지 (그리드 레이아웃)
- ✅ Admin 페이지 (로그인 UI)
- ✅ Black & White 테마 적용
- ✅ Docker 네트워크 환경 대응 (SSR/CSR 주소 자동 분기)

#### 인프라
- ✅ Docker Compose 환경 구성
- ✅ mise + uv 개발 도구 설정
- ✅ 환경변수 기반 설정 관리

#### 문서화
- ✅ README.md: 프로젝트 소개 및 빠른 시작 가이드
- ✅ DEVELOPMENT.md: 상세 개발 진행 상황 및 설계 결정 사항

---

## 📅 2025-10-05 (일) - MongoDB 하이브리드 & AI 기능
### Commit: 74166fd (13:02)

#### 1. MongoDB 하이브리드 아키텍처 구현
- ✅ PostgreSQL + MongoDB 하이브리드 구조 도입
  - PostgreSQL: 컬렉션 메타데이터 관리 (Collection 테이블)
  - MongoDB: 동적 아이템 데이터 저장 (items_* 컬렉션)
- ✅ Collection 모델에 `mongo_collection`, `field_definitions` (JSONB) 추가
- ✅ SQL Injection 방지: PostgreSQL 검증 후 MongoDB 접근
- ✅ 동적 컬렉션 CRUD API (`/api/items`) 구현
- ✅ MongoDB 컨테이너 docker-compose에 추가

#### 2. AI 기능 구현 (LangChain & LangGraph 1.0 alpha)
- ✅ AI 필드 추천 API (`/api/ai/suggest-fields`)
  - 컬렉션 이름 기반 메타데이터 자동 생성
  - OpenAI GPT 시리즈 지원 (GPT-4o Mini, GPT-4o, GPT-4.1, GPT-5 등)
  - Google Gemini 2.5 시리즈 지원 (Flash, Pro, Lite)
- ✅ AI 모델 관리 시스템
  - AIModelManager: JSON 기반 모델 데이터베이스
  - `backend/app/data/ai_models.json`: 모델 정보 및 가격 데이터
  - AI 모델 선택 API (`/api/ai/models`, `/api/ai/set-models`)
  - 비용 계산 기능

#### 3. Google OAuth 2.0 인증 완성
- ✅ 백엔드: FastAPI JWT 토큰 기반 인증
  - `/api/auth/google`: Google OAuth 로그인
  - `/api/auth/me`: 현재 사용자 정보
  - `require_owner` 의존성: 소유자 권한 검증
- ✅ 프론트엔드: React OAuth 클라이언트 통합
  - AuthContext: JWT 토큰 관리 (localStorage)
  - GoogleLogin 컴포넌트 통합
  - 로그인/로그아웃 기능

#### 4. Admin CRUD 페이지 구현
- ✅ `/admin/books`: 도서 관리 (생성/수정/삭제)
- ✅ `/admin/board-games`: 보드게임 관리 (생성/수정/삭제)
- ✅ 모달 기반 폼 UI
- ✅ API 통신 라이브러리 with 인증 헤더

#### 5. 개발 환경 및 문서
- ✅ 환경 변수 설정 (`SECRET_KEY`, `MONGO_URL`, AI API 키)
- ✅ 데이터베이스 초기화 스크립트 (`scripts/reset_database.sh`)
- ✅ COLLECTION_EXAMPLES.md: 필드 정의 예시
- ✅ AI_SETUP.md: AI 기능 설정 가이드
- ✅ DEVELOPMENT.md, README.md 업데이트

---

## 📅 2025-10-05 (일) - AI 모델 프론트엔드 & Python 3.13 업그레이드

#### 1. AI 모델 선택 프론트엔드 구현
- ✅ TypeScript 타입 정의 (`frontend/types/ai-models.ts`)
  - PricingInfo, AIModelConfig, ModelSelection, AISettings
- ✅ useAISettings 커스텀 훅 (`frontend/hooks/useAISettings.ts`)
  - localStorage ↔ 백엔드 동기화
  - 사용 가능한 모델 목록 가져오기
  - 설정 저장/로드
- ✅ ModelSelectionModal 컴포넌트 (`frontend/components/ModelSelectionModal.tsx`)
  - 텍스트/비전 모델 선택 드롭다운
  - 모델별 가격 정보 표시
  - 입력/출력 모달리티 표시
- ✅ 관리자 페이지 통합 (`/admin`)
  - "🤖 AI 모델 설정" 카드 추가
  - 현재 설정 모델 표시

#### 2. Python 3.13 업그레이드
- ✅ LangGraph 1.0 alpha 요구사항 충족
- ✅ pyproject.toml: `requires-python = ">=3.13"`
- ✅ .mise.toml: `python = "3.13"`
- ✅ .python-version: `3.13`
- ✅ Dockerfile.backend: `FROM python:3.13-slim`
- ✅ uv sync with `--prerelease=allow` (langgraph-prebuilt 설치)

#### 3. 환경 변수 구조 개선
- ✅ 데이터베이스 연결 정보를 구성 요소별로 분리
  - PostgreSQL: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - MongoDB: `MONGO_HOST`, `MONGO_PORT`, `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_DB`
- ✅ `backend/app/core/config.py`에서 동적 URL 생성
  - `@property DATABASE_URL`: PostgreSQL 연결 URL
  - `@property MONGO_URL`: MongoDB 연결 URL
- ✅ Docker Compose 환경 변수 개별 전달
- ✅ `.env`, `.env.example` 업데이트

#### 4. 레거시 코드 비활성화
- ✅ Book, BoardGame 모델 테이블 생성 비활성화
  - `__abstract__ = True` 설정
- ✅ Collection 모델에서 relationship 주석 처리
- ✅ docker-compose.yml에 Google OAuth 환경 변수 추가

---

## 📅 2025-10-05 (일) - Service Layer 리팩토링 & 레거시 제거

#### 1. Service Layer Pattern 구현
- ✅ **서비스 레이어 아키텍처 도입**
  - API: 라우팅 및 요청/응답 처리만 담당
  - Service: 비즈니스 로직 구현
  - 서비스별 디렉토리 구조 (collection/, item/, ai/)
- ✅ **Collection Service** (`backend/app/services/collection/`)
  - collection_service.py: 컬렉션 CRUD 로직
- ✅ **Item Service** (`backend/app/services/item/`)
  - item_service.py: 아이템 CRUD 로직
- ✅ **AI Services** (`backend/app/services/ai/`)
  - settings.py: AI 설정 관리 (공통)
  - field_suggestion_service.py: 필드 추천 로직
  - model_manager_service.py: 모델 관리 로직

#### 2. SQLAlchemy 2.0 마이그레이션
- ✅ **Legacy Query API 제거**
  - `db.query(Model)` → `db.execute(select(Model))`
  - `.all()` → `.scalars().all()`
  - `.first()` → `.scalar_one_or_none()`
- ✅ 모든 API 파일 업데이트
  - collections.py, items.py, ai.py

#### 3. 레거시 코드 완전 제거
- ✅ **API 파일 삭제**
  - `backend/app/api/books.py`
  - `backend/app/api/board_games.py`
  - `backend/app/api/__init__.py`에서 임포트 제거
  - `backend/app/main.py`에서 라우터 제거
- ✅ **모델 파일 삭제**
  - `backend/app/models/book.py`
  - `backend/app/models/board_game.py`
  - `backend/app/models/__init__.py` 업데이트
- ✅ **스키마 파일 삭제**
  - `backend/app/schemas/book.py`
  - `backend/app/schemas/board_game.py`
  - `backend/app/schemas/__init__.py` 업데이트
  - `field_suggestion.py` 스키마 추가

#### 4. Gemini 2.5 모델 매핑 수정
- ✅ 잘못된 2.0 매핑 제거
  - `gemini-2.5-flash` 모델 ID 그대로 사용
  - langchain-google-genai에서 정식 지원

#### 5. 문서 업데이트
- ✅ **README.md**
  - 레거시 API 참조 제거 (books, board-games)
  - Service Layer 아키텍처 섹션 추가
  - 프로젝트 구조 업데이트 (services/ 디렉토리)
  - 라우팅 구조 간소화
- ✅ **DEVELOPMENT.md**
  - Service Layer 리팩토링 작업 기록
  - 레거시 제거 작업 기록

---

## 📅 2025-10-05 (일) - 컬렉션 관리 UI & AI 필드 추천 프론트엔드

#### 1. 컬렉션 관리 UI 구현
- ✅ **컬렉션 관리 페이지** (`/admin/collections`)
  - 컬렉션 목록 그리드 레이아웃 (1/2/3 columns)
  - 생성/편집/삭제 기능
  - 모던 카드 디자인 (hover 효과, shadow)
- ✅ **CollectionModal 컴포넌트** (`frontend/components/CollectionModal.tsx`)
  - 컬렉션 생성/수정 모달 폼
  - 이름, 슬러그, 아이콘, 설명 입력
  - 슬러그 자동 생성 (이름 기반)
  - AI 필드 추천 통합
  - 필드 정의 JSON 프리뷰
- ✅ **AIFieldSuggestion 컴포넌트** (`frontend/components/AIFieldSuggestion.tsx`)
  - AI 기반 필드 자동 추천 UI
  - 선택된 AI 모델 사용 (설정된 텍스트 모델)
  - 로딩/에러/성공 상태별 UI
  - 추천된 필드 JSON 표시 및 적용
  - 자동 제안 (모달 열릴 때)

#### 2. API 프록시 라우트 구현
- ✅ **Next.js API Routes** (클라이언트 사이드 API 호출용)
  - `/api/collections` (GET, POST)
  - `/api/collections/[id]` (GET, PUT, DELETE)
  - `/api/ai/suggest-fields` (POST)
  - 인증 토큰 전달 및 Docker 내부 네트워크 주소 사용

#### 3. 디자인 시스템 개선
- ✅ **모던 디자인 적용**
  - 그라디언트 배경: `from-gray-50 to-gray-100`, `from-purple-50 to-blue-50`
  - 그라디언트 텍스트: `bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text`
  - 카드 디자인: `rounded-xl`, `shadow-sm`, `hover:shadow-xl`
  - Hover 애니메이션: `scale-110`, `rotate-3`, `translate-x-1`
  - 아이콘 컨테이너: 그라디언트 배경 (blue, purple)
- ✅ **메인 페이지 개선** (`/`)
  - 헤더 그라디언트 배경
  - 컬렉션 카드 hover 효과 강화
- ✅ **관리자 페이지 개선** (`/admin`)
  - 사용자 아바타 그라디언트
  - 관리 카드 아이콘 그라디언트 (컬렉션: blue, AI: purple)

#### 4. 환경 설정 개선
- ✅ **docker-compose.yml 포트 환경 변수화**
  - `POSTGRES_PORT`, `MONGO_PORT` 환경 변수 지원
  - 하드코딩된 포트 제거: `"5432:5432"` → `"${POSTGRES_PORT:-5432}:5432"`
  - 포트 충돌 시 유연한 변경 가능

#### 5. 타입 정의 통합
- ✅ **frontend/lib/api.ts**
  - Collection 인터페이스에 field_definitions 추가
  - API 함수들이 타입 안전하게 작성됨

---

## 📅 2025-10-06 (화) - 컬렉션 UI 완성 & Warehouse 테마

#### 1. 디자인 테마 전면 개편
- ✅ **Warehouse/Storage 테마 적용**
  - 기존: Purple/Blue (Claude 시그니처 색상)
  - 신규: Amber/Slate/Stone (창고/보관 느낌)
  - 배경: `stone-50`, `slate-100` (따뜻한 콘크리트 텍스처)
  - 헤더: `slate-800~900` (어두운 창고 인테리어)
  - 액센트: `amber-400~600` (빈티지 창고 조명)
  - 그림자 효과: `shadow-[0_0_20px_rgba(251,191,36,0.3)]`

#### 2. 인증 토큰 버그 수정
- ✅ **localStorage 키 불일치 해결**
  - 문제: AuthContext는 `auth_token`, 컴포넌트는 `authToken` 사용
  - 해결: 모든 컴포넌트를 `auth_token`으로 통일
  - 영향 받은 파일: CollectionModal.tsx, AIFieldSuggestion.tsx, page.tsx
- ✅ **AUTHENTICATION.md 문서 작성**
  - 인증 플로우, 보안 원칙, 보호된 API 목록

#### 3. Slug 자동 생성 시스템
- ✅ **AI 기반 번역 기능**
  - 한글 컬렉션 이름 → 영문 slug 자동 변환
  - `/api/ai/translate-slug` 엔드포인트 추가
  - Service Layer: `backend/app/services/ai/field_suggestion_service.py`
  - 프롬프트: URL-safe, 소문자, 하이픈 사용, 간결하게
- ✅ **Slug Optional 처리**
  - `CollectionCreate` 스키마에서 `slug: Optional[str] = None`
  - 비어있으면 백엔드에서 AI로 자동 생성
  - Fallback: MD5 해시 사용
- ✅ **한글 slug 지원 (MongoDB)**
  - MongoDB 컬렉션명 생성 시 한글 감지
  - ASCII가 아니면 MD5 해시로 변환 (`items_{hash}`)

#### 4. 필드 정의 에디터 개선
- ✅ **FieldDefinitionEditor 컴포넌트 신규 작성**
  - 기존: JSON 텍스트로만 표시
  - 신규: 테이블 형태 인라인 편집
  - 기능:
    - 각 필드를 행으로 표시 (key, label, type, required, placeholder)
    - "필드 추가" 버튼으로 직접 추가
    - 개별 삭제 버튼 (휴지통 아이콘)
    - 체크박스 선택 → "선택 삭제" 버튼
    - "AI 추천" 버튼으로 AI 호출
- ✅ **AI 추천 통합 개선**
  - "수정" 버튼 클릭 시 AI 재호출 하지 않음
  - AI 추천 결과를 표에 자동 반영
  - 빈 필드 상태에서도 직접 추가/AI 추천 선택 가능

#### 5. 이모지 피커 추가
- ✅ **50개 이모지 프리셋**
  - 5개 카테고리: 일반, 책/문서, 게임, 취미, 컬렉션
  - 각 카테고리 10개씩
  - 클릭으로 간편 선택
  - 직접 입력도 가능

#### 6. AI 모델 설정 필수화
- ✅ **모델 미설정 시 에러 처리**
  - `suggest_fields`: 모델 설정 없으면 400 에러
  - `translate_slug`: 모델 설정 없으면 400 에러
  - 에러 메시지: "AI 모델이 설정되지 않았습니다. 관리자 페이지에서 AI 모델을 먼저 설정해주세요."
  - 프론트엔드에서 에러 메시지 alert으로 표시

#### 7. 사용자 경험 개선
- ✅ **Slug 필드 UX 개선**
  - 기본적으로 숨김 (고급 옵션에 위치)
  - "고급 옵션 표시" 토글로 접근
  - 비워두면 저장 시 자동 생성 안내 문구
  - 기존 컬렉션은 slug 변경 불가 (disabled)
- ✅ **저장 중 로딩 스피너**
  - "생성 중..." / "저장 중..." 애니메이션
  - 사용자 피드백 개선

#### 8. 데이터 포맷 개선
- ✅ **필드 정의 구조 통일**
  - 내부: `FieldDefinition[]` 배열
  - 저장: `{ fields: FieldDefinition[] }` 객체
  - 불러올 때 배열로 변환
  - 저장할 때 객체로 변환

---

## 현재까지 완료된 작업 (통합)

### 1. 개발 환경 구축
- ✅ mise 설치 및 설정 (Python 3.13, Node 22, PostgreSQL 17)
- ✅ uv로 Python 패키지 관리 (pre-release 지원)
- ✅ Docker Compose 환경 구성 (PostgreSQL + MongoDB)
- ✅ Next.js 프론트엔드 초기 설정

### 2. 데이터베이스 아키텍처 (MongoDB 하이브리드)
#### PostgreSQL (메타데이터)
- ✅ **Collection (컬렉션)**
  - 기본 정보: id, name, slug, icon, description
  - `mongo_collection`: MongoDB 컬렉션명 매핑
  - `field_definitions` (JSONB): 메타데이터 필드 정의

#### MongoDB (실제 데이터)
- ✅ **동적 컬렉션**: items_* (예: items_books, items_games)
  - collection_id로 PostgreSQL과 연결
  - metadata (Object): 자유로운 스키마 구조
  - created_at, updated_at

### 3. 백엔드 API (FastAPI)
#### 인증 시스템
- ✅ Google OAuth 2.0 인증
  - JWT 토큰 기반 (python-jose)
  - 소유자 이메일만 편집 가능
  - `require_owner` 의존성 함수

#### RESTful API (Service Layer Pattern)
- ✅ `/api/collections` - 컬렉션 CRUD (Owner only)
  - MongoDB 컬렉션 자동 생성/삭제
  - slug → mongo_collection 자동 매핑
  - SQL Injection 방지 검증
  - Service: `backend/app/services/collection/collection_service.py`
- ✅ `/api/items` - 아이템 CRUD (동적 컬렉션)
  - GET `/items?collection_id={id}` - 목록 조회
  - POST `/items` - 생성 (Owner only)
  - PUT/DELETE `/items/{collection_id}/{item_id}` (Owner only)
  - Service: `backend/app/services/item/item_service.py`
- ✅ `/api/auth/google` - Google OAuth 로그인
- ✅ `/api/auth/me` - 현재 사용자 정보

#### AI 기능 (LangChain & LangGraph 1.0 alpha)
- ✅ `/api/ai/suggest-fields` - AI 필드 추천 (Owner only)
  - OpenAI GPT-4o Mini, GPT-4o, GPT-4.1, GPT-5 시리즈 지원
  - Google Gemini 2.5 Flash, Pro, Lite 지원
  - 컬렉션 이름 기반 메타데이터 자동 생성
  - Service: `backend/app/services/ai/field_suggestion_service.py`
- ✅ `/api/ai/models` - AI 모델 목록 조회
- ✅ `/api/ai/set-models` - AI 모델 설정 (Owner only)
- ✅ `/api/ai/get-models` - 현재 설정 조회
  - Service: `backend/app/services/ai/model_manager_service.py`
  - Settings: `backend/app/services/ai/settings.py` (공통 설정 관리)

#### AI 모델 관리 시스템
- ✅ AIModelManager: JSON 기반 모델 데이터베이스
  - `backend/app/data/ai_models.json`
  - OpenAI: GPT-4o Mini, GPT-4o, GPT-4.1, GPT-5 시리즈
  - Google: Gemini 2.5 Flash, Pro, Lite
  - 가격 정보, 모달리티 정보 포함
- ✅ 설정된 모델 자동 사용
- ✅ 비용 계산 기능

#### 백엔드 아키텍처
- ✅ **Service Layer Pattern**
  - API 레이어: 라우팅 및 요청/응답 처리만
  - Service 레이어: 비즈니스 로직 구현
  - 서비스별 디렉토리 구조 (collection/, item/, ai/)
- ✅ **SQLAlchemy 2.0 스타일**
  - Legacy Query API 제거
  - select() 패턴 사용

### 4. 프론트엔드 (Next.js)
#### 인증 시스템
- ✅ Google OAuth 클라이언트 통합 (@react-oauth/google)
- ✅ AuthContext: JWT 토큰 관리 (localStorage)
- ✅ 인증 상태 전역 관리

#### 라우팅 구조
- **Public (조회 전용)** ✅
  - `/` - 메인 페이지 (컬렉션 카드)
  - `/collections/[slug]` - 컬렉션별 아이템 목록

- **Admin (Owner only)** ✅
  - `/admin` - 관리 대시보드 (Google 로그인, AI 모델 설정)
  - `/admin/collections` - 컬렉션 관리 (CRUD 완성)

#### 구현된 기능
- ✅ Google Sign-In 버튼 통합
- ✅ 로그인/로그아웃 기능
- ✅ 컬렉션 CRUD 폼 (모달)
  - AI 필드 추천 통합
  - 필드 정의 JSON 편집
- ✅ API 통신 라이브러리 with 인증 헤더
- ✅ API 프록시 라우트 (SSR/CSR 분리)
- ✅ AI 모델 선택 UI (텍스트/비전 모델)

#### 컴포넌트
- ✅ **CollectionModal** - 컬렉션 생성/수정 모달
- ✅ **FieldDefinitionEditor** - 필드 정의 테이블 에디터
- ✅ **AIFieldSuggestion** - AI 필드 추천 UI
- ✅ **ModelSelectionModal** - AI 모델 선택 모달

#### 디자인 시스템 (Warehouse/Storage 테마)
- 컬러: Amber/Slate/Stone (창고 느낌), Gradient backgrounds, White cards
- 타이포그래피: System fonts, Gradient text effects
- 레이아웃: Responsive grid (1/2/3 columns)
- 인터랙션: Hover 효과 (scale, rotate, shadow), Smooth transitions
- 아이콘: 50개 이모지 프리셋 (5개 카테고리)

## 다음 작업 예정

### 우선순위 1: 아이템 관리 시스템 (다음 단계)
1. **아이템 관리 페이지 구현**
   - 🔲 `/admin/collections/[slug]/items` - 컬렉션별 아이템 CRUD
   - 🔲 동적 폼 생성 (field_definitions 기반)
     - text, textarea, number, date, select 타입 지원
     - 필수 필드 검증
     - placeholder 표시
   - 🔲 아이템 목록 테이블 (정렬/필터링)
   - 🔲 아이템 생성/수정/삭제 모달
   - 🔲 이미지 업로드 (선택사항)

2. **Public 아이템 목록 페이지**
   - 🔲 `/collections/[slug]` - 컬렉션별 아이템 조회
   - 🔲 그리드/리스트 뷰 전환
   - 🔲 정렬 기능 (이름순, 날짜순)
   - 🔲 간단한 검색 기능

### 우선순위 2: UX 개선
1. **검색 및 필터링**
   - 제목/저자/디자이너 검색
   - 카테고리별 필터

2. **정렬 기능**
   - 제목순, 날짜순, 가격순

3. **상세 페이지**
   - 개별 아이템 상세 정보

### 우선순위 3: pgVector 활용
1. **벡터 검색 구현**
   - 도서/게임 설명 임베딩
   - 유사 아이템 추천

2. **RAG 기반 검색**
   - 자연어 질의 지원

## 기술 스택

### 백엔드
- Python 3.13
- FastAPI
- SQLAlchemy
- PostgreSQL 17 + pgVector
- MongoDB 7
- Motor (async MongoDB driver)
- Google OAuth 2.0
- JWT (python-jose)
- LangChain 0.3+ & LangGraph 1.0 alpha
- OpenAI, Google Gemini

### 프론트엔드
- Next.js 14
- TypeScript
- Tailwind CSS
- React

### 인프라
- Docker & Docker Compose
- mise (버전 관리)
- uv (Python 패키지 관리)

## 환경 변수 설정

### 필수 설정 (.env)
```bash
# Database
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=mystorage

# Auth
OWNER_EMAIL=your-email@gmail.com
OWNER_NAME=Your Name
SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_OWNER_NAME=Your Name
```

### Docker 환경변수
- `API_URL_INTERNAL`: Docker 네트워크 내부 백엔드 주소 (자동 설정: `http://backend:8000`)
- `NEXT_PUBLIC_API_URL`: 브라우저에서 접근할 백엔드 주소
- `NEXT_PUBLIC_OWNER_NAME`: 메인 페이지 제목에 표시될 소유자 이름

## Google OAuth 설정 방법
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성
3. "API 및 서비스" > "사용자 인증 정보"
4. "OAuth 2.0 클라이언트 ID" 생성
   - 애플리케이션 유형: 웹 애플리케이션
   - 승인된 리디렉션 URI: `http://localhost:3000`
5. 클라이언트 ID와 시크릿을 `.env`에 설정

## 보안 및 인증

### 인증 시스템
- **Google OAuth 2.0** 기반
- **JWT 토큰** 발급 및 검증
- **소유자 검증**: `OWNER_EMAIL` 환경 변수와 일치하는 사용자만 허용

### 백엔드 API 보안
모든 관리 API는 `require_owner` 의존성으로 보호:
```python
@router.post("/", response_model=CollectionResponse)
async def create_collection(
    collection: CollectionCreate,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)  # 인증 필수
):
    ...
```

### 프론트엔드 토큰 관리
- **저장 위치**: `localStorage`
- **키 이름**: `auth_token` (일관성 유지 중요!)
- **전달 방식**: `Authorization: Bearer <token>` 헤더

### 보안 원칙
⚠️ **프론트엔드는 신뢰할 수 없음**
- 프론트엔드의 인증 체크는 UX 개선용
- 실제 보안은 백엔드에서 처리
- 모든 관리 API는 백엔드에서 토큰 검증 필수

자세한 내용: [AUTHENTICATION.md](./AUTHENTICATION.md)

## 개발 노트

### 설계 결정 사항
1. **Category → Collection 리네이밍**
   - Book/BoardGame의 `category` 필드(장르)와 혼동 방지
   - Collection: 도서/보드게임 등 대분류
   - category: 소설/기술서 등 소분류

2. **완전 분리 테이블 구조 선택**
   - 상속 패턴 대신 각 타입별 독립 테이블
   - 각 타입에 특화된 필드 정의 가능
   - 확장성 및 유지보수성 향상

3. **인증 방식**
   - Public: 조회만 가능 (인증 불필요)
   - Admin: 소유자만 편집 가능 (Google OAuth)
   - `/admin/*` 경로로 명확히 분리

4. **JSON 필드 대신 개별 컬럼 사용**
   - 타입별로 필요한 필드가 명확히 다름
   - 데이터 무결성 및 쿼리 성능 향상
