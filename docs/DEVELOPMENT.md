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

## 📅 2025-10-06 (월) - 컬렉션 UI 완성 & Warehouse 테마

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
  - 빈 필드 상태에서도 필드 추가/AI 추천 선택 가능

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

## 📅 2025-10-06 (월) - URL 크롤링 & CSV 일괄 등록

#### 1. Playwright 웹 스크래핑 시스템
- ✅ **pyproject.toml에 의존성 추가**
  - playwright>=1.49.0
  - beautifulsoup4>=4.12.0
- ✅ **WebScraper 서비스** (`backend/app/services/scraper/web_scraper.py`)
  - Playwright headless 브라우저로 JavaScript 렌더링된 페이지 크롤링
  - BeautifulSoup으로 HTML 파싱
  - Open Graph, Twitter Card, JSON-LD 메타데이터 추출
  - **사이트별 특화 파싱**:
    - URL 도메인 자동 감지 (kyobobook.co.kr, aladin.co.kr)
    - **교보문고**: 제목, 저자, 출판사, 출판일, 가격, ISBN, 설명
    - **알라딘**: 제목, 저자(복수), 출판사, 출판일, 가격, ISBN, 설명
    - CSS 셀렉터 기반 동적 정보 추출
  - Context manager 패턴으로 브라우저 리소스 관리
  - 단일/배치 스크래핑 지원

#### 2. 스크래핑 API 구현
- ✅ **백엔드 API** (`backend/app/api/scraper.py`)
  - `POST /api/scraper/scrape-url`: 단일 URL 스크래핑
  - `POST /api/scraper/scrape-and-create`: URL 스크래핑 후 아이템 생성
  - `POST /api/scraper/bulk-scrape`: 여러 URL 일괄 스크래핑
  - `POST /api/scraper/bulk-scrape-csv`: CSV 파일 업로드 일괄 처리
    - UTF-8 인코딩 검증
    - 헤더 자동 감지 (URL, link, 주소)
    - 에러 핸들링 및 개별 실패 보고
- ✅ **스키마 정의** (`backend/app/schemas/scraper.py`)
  - ScrapeUrlRequest, ScrapeUrlResponse
  - BulkScrapeRequest, BulkScrapeResponse, BulkScrapeProgress

#### 3. ItemModal URL 입력 모드
- ✅ **frontend/components/ItemModal.tsx**
  - 입력 모드 토글: 직접 입력 / URL로 가져오기
  - URL 입력 필드 + "정보 가져오기" 버튼
  - 스크래핑된 데이터 자동 폼 입력
  - 수동 모드로 전환하여 수정 가능
  - 로딩 스피너 및 에러 처리
  - 교보문고/알라딘 등 안내 문구

#### 4. CSV 일괄 등록 시스템
- ✅ **BulkImportModal 컴포넌트** (`frontend/components/BulkImportModal.tsx`)
  - CSV 파일 드래그 앤 드롭 지원
  - 실시간 진행 상황 표시:
    - 프로그레스 바 (0-100%)
    - 전체/성공/실패 통계
    - 에러 목록 표시
  - 파일 형식 안내 UI
  - 성공 시 3초 후 자동 닫기
- ✅ **아이템 관리 페이지 통합**
  - "📋 CSV 일괄 등록" 버튼 추가
  - 모달 방식으로 UX 개선

#### 5. Next.js API 프록시
- ✅ **프론트엔드 API Routes**
  - `/api/scraper/scrape-url`
  - `/api/scraper/bulk-scrape`
  - `/api/scraper/bulk-scrape-csv`
  - FormData 전달 지원 (CSV 업로드)

#### 6. 사용자 경험 개선
- ✅ **입력 편의성**
  - URL 붙여넣기만으로 자동 정보 입력
  - CSV로 대량 아이템 한 번에 등록
  - 진행 상황 실시간 모니터링
- ✅ **에러 핸들링**
  - 개별 URL 실패 시에도 나머지 계속 진행
  - 상세한 에러 메시지 제공
  - 성공/실패 건수 통계

## 📅 2025-10-06 (월) - 필드 매핑 시스템 & 스크래핑 개선

#### 1. 필드 매핑 시스템 구현
- ✅ **Collection 모델 확장**
  - `field_mapping` JSONB 컬럼 추가
  - 구조: `{"mapping": {"title": "책제목", ...}, "ignore_unmapped": bool}`
  - 스크래핑 필드명 → 사용자 정의 필드명 매핑

- ✅ **필드 매핑 API** (`backend/app/api/scraper.py`)
  - `POST /api/scraper/save-mapping`: 매핑 설정 저장
  - `GET /api/scraper/get-mapping/{collection_id}`: 저장된 매핑 조회
  - `apply_mapping` 옵션 추가 (scrape-url)

- ✅ **필드 매핑 스키마** (`backend/app/schemas/scraper.py`)
  - `FieldMappingRequest`: mapping dict + ignore_unmapped bool
  - `ScrapeUrlRequest`에 `apply_mapping: bool` 추가

- ✅ **apply_field_mapping() 함수** (`backend/app/services/scraper/web_scraper.py`)
  - 스크래핑 데이터에 매핑 적용
  - `ignore_unmapped=True`: 매핑된 필드만 저장 (기본, 추천)
  - `ignore_unmapped=False`: 매핑 안 된 필드도 원래 키로 저장
  - 예시:
    ```python
    # 스크래핑: {"title": "...", "author": "...", "extra": "..."}
    # 매핑: {"title": "책제목", "author": "저자명"}
    # ignore_unmapped=True: {"책제목": "...", "저자명": "..."}
    # ignore_unmapped=False: {"책제목": "...", "저자명": "...", "extra": "..."}
    ```

#### 2. FieldMappingModal 컴포넌트
- ✅ **frontend/components/FieldMappingModal.tsx**
  - **자동 매칭 로직**:
    - 정확히 일치하는 필드 우선 (exact match)
    - 유사한 이름 검색 (similar match)
    - 대소문자 무시, label까지 검색
  - **수동 매핑**:
    - 각 스크래핑 필드별 드롭다운
    - "매핑 안 함" 옵션 지원
    - 실시간 미리보기 표시
  - **통계 및 옵션**:
    - 매핑된/안 된 필드 개수 표시
    - "매핑되지 않은 필드 무시" 체크박스
      - 체크 시: amber 배경 (추천, 매핑된 필드만 저장)
      - 해제 시: blue 배경 (모든 필드 저장)
    - "이 매핑 설정을 저장" 체크박스
      - 다음 스크래핑 시 자동 적용
      - 일괄 등록에도 적용
  - **UI/UX**:
    - 테이블 형태 매핑 인터페이스
    - "🤖 자동 매칭" 버튼
    - 스크래핑 필드 → 내 필드 화살표 표시
    - 데이터 미리보기 (50자 제한)

#### 3. ISBN 파싱 개선
- ✅ **13자리 ISBN 우선 처리**
  - 정규식: `r'ISBN[:\s]*(\d{13})'` 우선 검색
  - 실패 시 10자리 fallback: `r'ISBN[:\s]*(\d{10})'`
  - 교보문고, 알라딘 파서 모두 적용

#### 4. Dockerfile 업데이트
- ✅ **Playwright 설치 명령 추가**
  - `RUN uv run playwright install chromium`
  - `RUN uv run playwright install-deps`
  - headless 브라우저 의존성 자동 설치

#### 5. 스크래핑 매핑 통합
- ✅ **단일 URL 스크래핑 시 매핑 자동 적용**
  - `apply_mapping=True`인 경우 저장된 매핑 자동 적용
  - 신규 형식 `{"mapping": {...}, "ignore_unmapped": bool}` 지원
  - 레거시 형식 (단순 dict) 호환성 유지

#### 6. 향후 작업
- 🔲 **ItemModal에 필드 매핑 UI 통합**
  - URL 스크래핑 후 매핑 모달 표시
  - 매핑 적용 후 폼에 자동 입력
- 🔲 **BulkImportModal에 필드 매핑 통합**
  - CSV 업로드 시 매핑 설정 옵션
  - 저장된 매핑 자동 적용
- 🔲 **Database Migration**
  - 기존 Collection 레코드에 field_mapping 컬럼 추가

---

## 📅 2025-10-06 (월) - 스크래핑 버그 수정 & 모달 UX 개선

#### 1. 스크래핑 버그 수정
- ✅ **`page.url` await 버그 수정** (`web_scraper.py:143`)
  - 문제: `await page.url` - TypeError 발생 (속성은 await 불가)
  - 수정: `page.url`로 변경

- ✅ **JSON-LD 파싱 타입 안전성 개선** (`web_scraper.py:119-131`)
  - 문제: `author`, `publisher`가 dict가 아닐 수 있음
  - 수정: `isinstance()` 체크로 dict와 string 모두 처리

- ✅ **에러 로깅 시스템 추가**
  - `logger.error()` + `traceback.format_exc()`로 상세 스택 출력
  - API 레벨 (`scraper.py`) 및 서비스 레벨 (`web_scraper.py`) 로깅
  - print → logger.warning 변경

#### 2. 모달 UX 개선
- ✅ **모든 모달에 바깥 클릭 및 ESC 키로 닫기 기능 추가**
  - CollectionModal
  - ItemModal
  - BulkImportModal (진행 중일 때는 닫기 불가)
  - FieldMappingModal
  - ModelSelectionModal
  - `useEffect()` + `handleBackdropClick()` 패턴 적용

#### 3. 프론트엔드 일관성 개선
- ✅ **버튼 텍스트 통일**
  - "아이템 추가" → "새 아이템"으로 통일
  - "컬렉션 추가" → "새 컬렉션"으로 통일

---

## 📅 2025-10-07 (화) - 필드 매핑 로직 재설계

#### 1. 필드 매핑 방향 전환 ✅
- **기존 방식**: 스크래핑한 필드 → 사용자 필드로 매핑 (스크래핑 결과 중심)
  - 문제점: 스크래핑 못 가져온 필드가 많음 (사이트별 파서 한계)
- **새로운 방식**: 사용자 필드 중심 매핑
  - 사용자가 정의한 필드 목록을 기준으로 UI 구성
  - 각 사용자 필드마다 스크래핑 데이터 중 선택
  - 스크래핑 데이터에 없으면 직접 수동 입력 가능

#### 2. FieldMappingModal 완전 재설계 ✅
- **새로운 UI 구조**:
  - 테이블: `내 필드` ← `스크래핑 데이터 선택` | `또는 직접 입력`
  - 각 사용자 필드마다 한 행씩 표시
  - 필드명, 라벨, 필수 여부 표시
- **매핑 방식**:
  - 드롭다운에서 스크래핑 데이터 선택 (미리보기 포함)
  - 스크래핑 데이터 선택 시 수동 입력 비활성화
  - 선택하지 않으면 직접 입력 가능
- **자동 매칭 개선**:
  - 사용자 필드 기준으로 유사한 스크래핑 필드 찾기
  - 정확히 일치하는 필드 우선, 부분 일치 fallback
- **매핑 통계**:
  - 매핑된/비어있는 필드 개수 표시
  - 매핑 설정 저장 옵션

#### 3. ItemModal 통합 ✅
- **URL 스크래핑 플로우**:
  1. URL 입력 → 스크래핑
  2. 저장된 매핑 자동 로드
  3. FieldMappingModal 표시
  4. 사용자가 매핑 확인/수정
  5. 매핑 적용 → 폼에 자동 입력
  6. 매핑 저장 옵션 선택 시 백엔드에 저장
- **매핑 형식 변환**:
  - 프론트엔드: `{ "책제목": "title", "저자명": "author" }` (사용자 → 스크래핑)
  - 백엔드: `{ "title": "책제목", "author": "저자명" }` (스크래핑 → 사용자)
  - 저장/불러오기 시 자동 변환

#### 4. BulkImportModal 지원 ✅
- **자동 매핑 적용**:
  - CSV 일괄 등록 시 저장된 매핑 자동 적용
  - 별도 UI 작업 불필요 (백엔드에서 처리)
  - `apply_field_mapping` 함수가 일괄 스크래핑에도 적용됨

#### 5. 사용자 경험 개선
- **직관적인 UI**:
  - 내 필드가 먼저 보임 (좌측)
  - 화살표(←)로 방향성 명확히 표시
  - 스크래핑 데이터 미리보기 (50자 제한)
- **유연한 입력**:
  - 스크래핑 데이터가 없어도 수동 입력으로 보완 가능
  - 필수 필드는 빨간 별표(*)로 표시
- **자동화**:
  - 한 번 매핑 저장하면 다음부터 자동 적용
  - 일괄 등록에도 동일한 매핑 사용

---

## 📅 2025-10-07 (화) - 버그 수정 및 개선

#### 1. 교보문고 ISBN 파싱 수정 ✅
- **문제**: 교보문고 페이지 구조 변경으로 ISBN 추출 실패 (null 반환)
- **1차 시도 실패 원인**: `.info_detail_wrap` 셀렉터가 더 이상 존재하지 않음
- **2차 시도 실패 원인**: `_parse_kyobo` 함수 내부에서 로컬 빈 `metadata`를 사용하여 이미 추출된 `image` 정보에 접근 불가
- **최종 해결**:
  - `_parse_kyobo` 함수에 `existing_metadata` 파라미터 추가
  - `existing_metadata['image']`에서 ISBN 추출
  - 패턴: `https://contents.kyobobook.co.kr/sih/fit-in/458x0/pdt/9791136287489.jpg`
  - 정규식: `/pdt/(\d{13})\.`
  - Fallback: 페이지 텍스트에서 정규식 검색
- **교훈**: 사이트별 특화 파싱 함수에서 일반 파싱에서 이미 추출된 메타데이터에 접근해야 할 경우, 파라미터로 전달 필요

#### 2. 알라딘 작가 정보 HTML 엔티티 디코딩 ✅
- **문제**: `尾田&#26628;一&#37070;` 형태로 표시됨
- **원인**: HTML 엔티티가 디코딩되지 않음
- **해결**: `html.unescape()` 함수 적용
  - `import html`
  - `text = html.unescape(text)`

#### 3. 아이템 생성 422 에러 수정 ✅
- **문제**: `POST /api/items` 요청 시 422 Unprocessable Content
- **원인**: `ItemCreate` 스키마에서 `title` 필드가 필수였으나 프론트엔드에서 전송하지 않음
- **해결**:
  - 백엔드 스키마: `title`을 Optional로 변경
  - 아이템 생성 서비스: metadata에서 title 자동 추출
    - 우선순위: `title`, `name`, `제목`, `이름` 필드
    - Fallback: 첫 번째 메타데이터 값 또는 "Untitled"

#### 4. 프론트엔드 빌드 에러 수정 ✅
- **문제**: `Type 'boolean | ""' is not assignable to type 'boolean | undefined'`
- **원인**: `hasScrapedData` 변수가 truthy 값을 반환 (빈 문자열 포함)
- **해결**: 명시적 boolean 변환 `!!(scrapedKey && scrapedData[scrapedKey] !== undefined)`
- **발생 파일**: `frontend/components/FieldMappingModal.tsx:244`

#### 5. 공통 이슈 해결 패턴
- **스크래퍼 안정성**: 웹사이트 구조 변경에 대비한 Fallback 로직 구현
- **타입 안전성**: TypeScript strict mode에서 명시적 타입 변환 중요
- **데이터 유연성**: 필수 필드를 Optional로 만들고 기본값/자동 추출 제공

---

## 📅 2025-10-07 (화) - UI/UX 개선 & Title 필수 필드화

#### 1. 관리자 화면 테이블 레이아웃 개선 ✅
- **문제**: 긴 텍스트가 테이블 레이아웃을 깨뜨림
- **해결**:
  - 컬럼명: `whitespace-nowrap`으로 항상 한 줄 유지
  - 각 필드의 최대 글자 수를 계산하여 동적 너비 조정
  - 10자 이하: 150px, 10~50자: 300~450px, 50~100자: 450~750px, 100자 이상: 750~9000px
  - `table-auto`로 내용에 따라 자동 조정
- **파일**: `frontend/app/admin/collections/[slug]/items/page.tsx`

#### 2. Public 화면 완전 개편 ✅
- **기존 문제**: 모든 필드가 노출되어 복잡하고 긴 텍스트가 레이아웃 깨뜨림
- **새로운 방식**:
  - **그리드 뷰**: Title만 표시하는 깔끔한 카드 + "상세보기" 버튼
  - **리스트 뷰**: 제목, 등록일, 상세보기 버튼만 표시
  - **상세 모달**: 모든 필드 정보를 모달로 표시
    - ESC 키 및 외부 클릭으로 닫기 가능
    - 모든 필드를 깔끔하게 나열
    - 값이 없는 필드는 자동으로 숨김
- **파일**: `frontend/app/collections/[slug]/page.tsx`

#### 3. Title 필드 필수화 ✅
- **FieldDefinitionEditor 개선**:
  - title 필드 자동 추가 (없으면 맨 앞에 생성)
  - title 필드는 파란색 배경으로 시각적 구분
  - 🔒 필수 표시
  - key, type, required 수정 불가
  - 삭제 불가 (삭제 버튼 비활성화)
  - 체크박스 선택 불가
- **AI 추천 프롬프트 수정**:
  - "title 필드는 절대 추천하지 마세요" 규칙 추가
  - title은 시스템에서 자동 관리되는 필수 필드로 명시
- **파일**:
  - `frontend/components/FieldDefinitionEditor.tsx`
  - `backend/app/services/ai/field_suggestion_service.py`

#### 4. Title 자동 추출 로직
- metadata에서 `title`, `제목`, `name`, `이름` 순으로 검색
- 없으면 `item.title` 또는 "Untitled" 표시
- Public 페이지 그리드/리스트 뷰 모두 적용

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

### 우선순위 1: 아이템 관리 시스템 ✅ 완료!
1. **아이템 관리 페이지 구현** ✅
   - ✅ `/admin/collections/[slug]/items` - 컬렉션별 아이템 CRUD
   - ✅ 동적 폼 생성 (field_definitions 기반)
     - text, textarea, number, date, select 타입 지원
     - 필수 필드 검증
     - placeholder 표시
   - ✅ 아이템 목록 테이블 (정렬/필터링)
   - ✅ 아이템 생성/수정/삭제 모달
   - 🔲 이미지 업로드 (선택사항)

2. **Public 아이템 목록 페이지** ✅
   - ✅ `/collections/[slug]` - 컬렉션별 아이템 조회
   - ✅ 그리드/리스트 뷰 전환
   - ✅ 정렬 기능 (이름순, 날짜순)
   - ✅ 간단한 검색 기능

### 우선순위 2: UX 개선
1. **상세 페이지**
   - 🔲 개별 아이템 상세 정보

2. **이미지 업로드**
   - 🔲 S3 또는 로컬 스토리지 연동
   - 🔲 이미지 필드 타입 추가
   - 🔲 썸네일 표시

### 우선순위 3: pgVector 활용
1. **벡터 검색 구현**
   - 🔲 도서/게임 설명 임베딩
   - 🔲 유사 아이템 추천

2. **RAG 기반 검색**
   - 🔲 자연어 질의 지원

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

---

## 📅 2025-10-06 (월) - 아이템 관리 시스템 완성

#### 1. 백엔드 API 프록시 구현
- ✅ **Next.js API Routes 추가**
  - `/api/items` (GET, POST)
  - `/api/items/[collectionId]/[itemId]` (GET, PUT, DELETE)
  - Docker 내부 네트워크 주소 사용
  - 인증 토큰 전달

#### 2. 프론트엔드 API 라이브러리 확장
- ✅ **frontend/lib/api.ts**
  - `getCollectionBySlug()`: slug로 컬렉션 조회
  - `createItem()`: 아이템 생성
  - `updateItem()`: 아이템 수정
  - `deleteItem()`: 아이템 삭제
  - 모든 함수에 인증 토큰 전달

#### 3. ItemModal 컴포넌트 구현
- ✅ **frontend/components/ItemModal.tsx**
  - 동적 폼 생성 (field_definitions 기반)
  - 타입별 입력 필드:
    - `text`: 일반 텍스트 입력
    - `textarea`: 여러 줄 텍스트 (min-height: 120px)
    - `number`: 숫자 입력
    - `date`: 날짜 선택기
    - `select`: 드롭다운 (options 기반)
  - 필수 필드 검증 (빨간색 별표 + 에러 메시지)
  - placeholder 표시
  - 생성/수정 모드 지원
  - 저장 중 로딩 스피너

#### 4. Admin 아이템 관리 페이지 구현
- ✅ **frontend/app/admin/collections/[slug]/items/page.tsx**
  - 컬렉션별 아이템 CRUD
  - 기능:
    - 아이템 생성/수정/삭제
    - 실시간 검색 (모든 metadata 필드)
    - 정렬 (생성일 + 모든 필드별 정렬)
    - 오름차순/내림차순 전환
  - UI:
    - 테이블 레이아웃
    - 컬럼 헤더 클릭으로 정렬
    - Hover 효과 (amber-50)
    - 편집/삭제 버튼
  - 빈 상태 UI (아이템 없을 때)
  - 검색 결과 없을 때 안내

#### 5. Public 아이템 목록 페이지 구현
- ✅ **frontend/app/collections/[slug]/page.tsx**
  - 조회 전용 페이지
  - 기능:
    - 검색 (모든 metadata 필드)
    - 정렬 (생성일 + 모든 필드별)
    - 그리드 ↔ 리스트 뷰 전환
  - UI:
    - **그리드 뷰**: 카드 레이아웃 (3 columns)
      - 각 필드를 세로로 표시
      - hover 효과 (border-amber-400 + shadow)
    - **리스트 뷰**: 테이블 레이아웃
      - 모든 필드를 가로로 표시
      - hover 효과 (amber-50)
    - 뷰 모드 토글 버튼 (그리드/리스트 아이콘)
  - Warehouse 테마 적용
  - 헤더에 컬렉션 정보 표시

#### 6. 컬렉션 관리 페이지 연결
- ✅ **frontend/app/admin/collections/page.tsx**
  - "아이템 관리" 버튼을 Link로 변경
  - `/admin/collections/${slug}/items`로 이동

#### 7. 사용자 경험 개선
- ✅ **검색 및 정렬**
  - useMemo로 성능 최적화
  - 대소문자 무시 검색
  - 모든 metadata 값 검색 지원
- ✅ **로딩 상태 관리**
  - 삭제 중 버튼 비활성화
  - 저장 중 스피너 표시
- ✅ **에러 처리**
  - 컬렉션 조회 실패 시 관리자 페이지로 리다이렉트
  - 필드 정의 없을 때 안내 메시지

---

## 📅 2025-10-09 (목) - 스크래핑 개선 & DeepL 번역 시스템

#### 1. 웹 스크래핑 필드 확장 ✅
- **페이지수(쪽수) 추출 기능 추가**
  - 교보문고: "n쪽" 패턴에서 숫자 추출
  - 알라딘: "n쪽" 패턴에서 숫자 추출
  - 정규식: `r'(\d+)\s*쪽'`
  - 없으면 null 처리

- **카테고리 추출 기능 추가**
  - 교보문고: breadcrumb의 두 번째 레벨 (예: "국내도서 > 만화")
  - 알라딘: 구조가 복잡하여 지원하지 않음
  - CSS 셀렉터: `.breadcrumb_item[data-id]`

- **SCRAPER_FIELDS.md 업데이트**
  - 교보문고/알라딘에서 추출 가능한 필드 문서화
  - 페이지수, 카테고리 정보 추가

#### 2. DeepL 번역 시스템 구현 ✅
- **기존 문제점**:
  - Slug 번역을 AI 모델(GPT/Gemini)로 처리
  - AI 모델 설정이 필요하여 진입 장벽 높음
  - 컬렉션 생성 시 AI 미설정 에러 발생

- **DeepL API 도입**:
  - **공식 Python 라이브러리 사용** (`deepl==1.23.0`)
  - 월 500,000 문자 무료 (Free tier)
  - 번역 품질 우수
  - AI 모델 설정 불필요

- **Translation Service 분리** (`backend/app/services/ai/translation_service.py`):
  - `translate_slug(text: str)` 함수
  - DeepL API로 한글 → 영문 번역
  - slug 형식 자동 변환 (소문자, 하이픈, 특수문자 제거)
  - Fallback: MD5 해시 사용

- **환경 변수 설정**:
  - `DEEPL_API_KEY` 추가
  - `.env`, `.env.example` 업데이트
  - `docker-compose.yml`에 환경변수 전달

- **API 파라미터 통일**:
  - `TranslateSlugRequest`: `name` → `text`로 변경
  - 더 범용적인 이름 (컬렉션 이름뿐만 아니라 다양한 텍스트 번역 가능)

#### 3. AI 기능 UX 개선 ✅
- **AI 모델 미설정 시 처리**:
  - **FieldDefinitionEditor**: AI 추천 버튼 비활성화
  - **CollectionModal**: Slug 번역 버튼은 DeepL로 동작 (AI 설정 불필요)
  - 툴팁 추가: "AI 모델을 먼저 설정해주세요"

- **AIFieldSuggestion 개선**:
  - `useEffect` dependency를 `[settings.textModel]`로 변경
  - AI 설정 로드 후 자동 실행
  - AI 모델 없으면 명확한 에러 메시지
  - 컬렉션 생성은 AI 없이도 가능하다는 안내 추가

- **버튼 상태 관리**:
  - AI 모델 설정 여부에 따라 버튼 활성화/비활성화
  - 버튼 활성화 상태에서만 기능 동작 보장

#### 4. ItemModal URL 입력 개선 ✅
- **정보 표시 추가**:
  - 추출 가능한 필드 안내 문구 추가
  - "교보문고(카테고리, 쪽수), 알라딘(카테고리 미지원)" 표시

#### 5. 서비스 아키텍처 개선 ✅
- **Translation Service 분리**:
  - 기존: `field_suggestion_service.py`에 `translate_slug` 함수
  - 신규: `translation_service.py`로 분리
  - 목적별 서비스 파일 구조 명확화:
    - `field_suggestion_service.py`: AI 필드 추천 (OpenAI/Gemini)
    - `translation_service.py`: 번역 서비스 (DeepL)
    - `model_manager_service.py`: AI 모델 관리
    - `settings.py`: AI 설정 관리

#### 6. 기술 스택 업데이트
- **새로운 의존성**:
  - `deepl==1.23.0`: 공식 DeepL Python 라이브러리
- **환경 변수**:
  - `DEEPL_API_KEY`: DeepL API 인증 키

---

## 📅 2025-10-09 (목) - 필드 매핑 시스템 고도화 & Public 페이지 이미지 표시

#### 1. 매핑 확인 UI 시스템 구현 ✅
- **문제점 인식**:
  - 사용자가 컬렉션 field_definitions를 변경하면 저장된 field_mapping이 맞지 않게 됨
  - Bulk scrape 시 매핑 적용 여부를 선택할 수 없음
  - 저장된 매핑을 확인하고 선택할 방법이 없음

- **MappingConfirmationModal 신규 구현** (`frontend/components/MappingConfirmationModal.tsx`):
  - **저장된 매핑 자동 표시**: Bulk scrape 시작 시 저장된 매핑이 있으면 확인 모달 자동 표시
  - **매핑 상세 정보**:
    - 스크래핑 필드 → 사용자 필드 매핑 표시 (화살표 포함)
    - 필드 일치 여부 시각적 표시 (초록색/빨간색 배지)
    - "매핑되지 않은 필드 무시" 옵션 표시
  - **필드 정의 불일치 경고**:
    - 저장된 매핑의 일부 필드가 현재 컬렉션 필드 정의와 일치하지 않으면 amber 경고 표시
    - 매핑 삭제 및 재설정 권장
  - **3가지 선택지**:
    - "매핑 사용": 저장된 매핑으로 스크래핑 진행
    - "매핑 사용 안 함": 원본 필드 그대로 저장 (매핑은 유지)
    - "취소": 작업 취소

- **Bulk scrape API 확장** (`backend/app/api/scraper.py`):
  - `POST /api/scraper/bulk-scrape`: `apply_mapping: bool` 파라미터 추가
  - `POST /api/scraper/bulk-scrape-csv`: `apply_mapping: bool` 파라미터 추가
  - 매핑 적용 로직 추가 (단일 URL 스크래핑과 동일)
  - `BulkScrapeRequest` 스키마에 `apply_mapping: bool = False` 추가

- **필드 매핑 삭제 API** (`backend/app/api/scraper.py`):
  - `DELETE /api/scraper/delete-mapping/{collection_id}`: 저장된 매핑 삭제
  - 컬렉션의 `field_mapping`을 `None`으로 설정

#### 2. BulkImportModal 통합 ✅
- **매핑 확인 플로우**:
  1. CSV 파일 선택 → "일괄 등록 시작" 버튼 클릭
  2. 저장된 매핑 자동 조회 (`/api/scraper/get-mapping`)
  3. 매핑이 있으면 MappingConfirmationModal 표시
  4. 사용자 선택에 따라 `apply_mapping` 플래그 전달
  5. 백엔드에서 매핑 적용하여 아이템 생성

- **frontend/components/BulkImportModal.tsx 수정**:
  - `handleUpload()`: 매핑 조회 로직 추가
  - `performUpload(useMapping)`: 실제 업로드 함수 분리
  - FormData에 `apply_mapping` 추가
  - MappingConfirmationModal 통합

#### 3. Public 페이지 이미지 표시 개선 ✅
- **문제점**:
  - 스크래핑 데이터는 `image_url` 필드에 이미지 URL 저장
  - Public 페이지 컴포넌트는 `image`, `이미지`, `표지`, `cover` 등만 검색
  - `image_url` 필드를 찾지 못해 이미지가 표시되지 않음

- **frontend/app/collections/[slug]/page.tsx 수정**:
  - `getImage()` 함수의 `imageKeys` 배열 맨 앞에 `'image_url'` 추가
  - 이미지 비율 개선: `aspect-[3/4]` 고정 → `h-auto object-contain` (원본 비율 유지)
  - 상세보기 모달에서 `image_url` 필드 자동 숨김 (이미 이미지로 표시되므로 중복 방지)

#### 4. 사용자 경험 개선
- **직관적인 매핑 확인**:
  - 저장된 매핑을 시각적으로 확인 가능
  - 필드 불일치 자동 감지 및 경고
  - 매핑 사용/사용 안 함 선택 가능

- **유연한 작업 흐름**:
  - 매핑을 사용하지 않아도 저장된 매핑은 유지됨
  - 다음 스크래핑에서 다시 선택 가능
  - 필요시 매핑 삭제하여 새로 설정 가능

- **이미지 표시 자동화**:
  - 스크래핑된 이미지 자동 표시
  - 원본 비율 유지로 레이아웃 개선
  - 상세보기에서 중복 정보 자동 제거

#### 5. 기술적 개선
- **API 일관성**: 모든 스크래핑 엔드포인트에 `apply_mapping` 옵션 통일
- **매핑 형식 호환성**: 프론트엔드 ↔ 백엔드 매핑 형식 자동 변환
- **모달 재사용성**: MappingConfirmationModal을 독립 컴포넌트로 구현

---

## 📅 2025-10-08 (수) - UI/UX 개선 & Title 필드 시스템 재설계

#### 1. Public 페이지 텍스트 정리 ✅
- **문제**: 설명 텍스트에 줄바꿈(`\n`)과 연속 공백이 그대로 표시됨
- **해결**:
  - `frontend/app/page.tsx`: 컬렉션 설명에서 공백/줄바꿈 정리
  - `frontend/app/collections/[slug]/page.tsx`:
    - 상세 모달의 모든 필드 값에 공백/줄바꿈 정리 적용
    - `whitespace-pre-wrap` 제거
  - 정규식: `.replace(/\s+/g, ' ').trim()` - 연속 공백을 단일 공백으로 변환

#### 2. ItemDetailModal ESC 키 지원 ✅
- **기능**: 상세보기 모달을 ESC 키로 닫을 수 있도록 개선
- **구현**: `useEffect` + `keydown` 이벤트 리스너
- **파일**: `frontend/app/collections/[slug]/page.tsx`

#### 3. Title 필드 필수화 및 UI 분리 ✅
- **문제점**:
  - 사용자가 "필드 추가" 버튼을 눌러야 title 필드가 보임
  - title 필드가 일반 필드와 섞여서 삭제/수정 가능해 보임
  - AI 추천 후 title 필드가 사라지는 버그

- **해결책: Title 필드 영역 분리**
  - **필수 필드 섹션** (상단)
    - Title 필드만 파란색 테두리로 고정 표시
    - "🔒 고정" 배지
    - Label과 Placeholder만 수정 가능
    - Key, Type, Required는 수정 불가
  - **추가 필드 섹션** (하단)
    - Title을 제외한 나머지 필드만 테이블에 표시
    - AI 추천, 필드 추가 버튼 항상 노출
    - 빈 상태에서도 버튼 사용 가능

- **FieldDefinitionEditor 리팩토링** (`frontend/components/FieldDefinitionEditor.tsx`):
  - `titleField`와 `otherFields`로 분리
  - `addField()`: title 필드 유지하며 새 필드 추가
  - `updateTitleField()`: title 필드 전용 업데이트 함수
  - 모든 CRUD 함수에서 title 필드 보존 로직 구현
  - 체크박스 선택, 삭제 등에서 title 필드 자동 제외

- **CollectionModal 수정** (`frontend/components/CollectionModal.tsx`):
  - 새 컬렉션 생성 시 title 필드 기본 추가
  - `handleAISuggestionApply()`: AI 추천 결과에 title 필드 유지
  - 매핑 형식 자동 변환 (프론트엔드 ↔ 백엔드)

- **AIFieldSuggestion 개선** (`frontend/components/AIFieldSuggestion.tsx`):
  - 컬렉션 이름이 없으면 에러 메시지 표시
  - 빈 상태 UI 개선

#### 4. 타입 에러 수정 ✅
- **문제**: `Item` 인터페이스에 `title` 속성이 없는데 참조하려고 함
- **해결**: `frontend/app/collections/[slug]/page.tsx`
  - 25번 줄: `item.title || 'Untitled'` → `'Untitled'`
  - 376번 줄: 동일하게 수정
  - metadata에서 title 필드를 찾는 로직만 사용

#### 5. 사용자 경험 개선
- **명확한 UI 구조**: 필수 필드 vs 추가 필드 시각적 분리
- **직관적인 워크플로우**:
  - 컬렉션 생성 시 title 필드 자동 생성
  - AI 추천 시 title 필드 자동 보존
  - 필드 추가 버튼 항상 접근 가능
- **일관성**: 모든 경로에서 title 필드 보존 (추가/수정/삭제/AI추천)

---
