# myStorage

개인 소장품 관리 시스템 (도서, 보드게임 등)

## 프로젝트 소개

개인 소장품을 체계적으로 관리할 수 있는 웹 애플리케이션입니다.
- **조회 기능**: 누구나 소장품 목록을 볼 수 있습니다
- **관리 기능**: Google OAuth로 인증된 소유자만 편집 가능합니다
- **동적 컬렉션**: 관리자가 자유롭게 컬렉션 타입과 메타데이터 필드를 정의할 수 있습니다
- **AI 기능**: LangChain 기반 AI가 컬렉션에 맞는 메타데이터 필드를 자동으로 추천합니다

## 기술 스택

### 백엔드
- **Python 3.13** - 프로그래밍 언어
- **FastAPI** - Python 웹 프레임워크
- **SQLAlchemy** - ORM
- **PostgreSQL 17 + pgVector** - 메타데이터 및 컬렉션 정의 저장
- **MongoDB 7** - 동적 아이템 데이터 저장 (하이브리드 구조)
- **Motor** - Async MongoDB 드라이버
- **Google OAuth 2.0** - 인증
- **JWT (python-jose)** - 토큰 기반 인증
- **LangChain 0.3+ & LangGraph 1.0 alpha** - AI 기능
- **OpenAI GPT / Google Gemini** - AI 모델

### 프론트엔드
- **Next.js 14** - React 프레임워크
- **TypeScript**
- **Tailwind CSS** - 스타일링
- **@react-oauth/google** - Google OAuth 클라이언트

### 인프라
- **Docker & Docker Compose** - 컨테이너화
- **mise** - 개발 도구 버전 관리
- **uv** - Python 패키지 관리

## 현재 구현된 기능

### 백엔드 API
- ✅ **컬렉션 관리 API** (`/api/collections`) - Owner only
  - MongoDB 컬렉션 자동 생성/삭제
  - slug → mongo_collection 자동 매핑
  - SQL Injection 방지 검증
- ✅ **아이템 관리 API** (`/api/items`) - 동적 컬렉션 CRUD
  - GET `/items?collection_id={id}` - 목록 조회
  - POST `/items` - 생성 (Owner only)
  - PUT/DELETE `/items/{collection_id}/{item_id}` (Owner only)
- ✅ **Google OAuth 인증** (`/api/auth/google`, `/api/auth/me`)
- ✅ **AI 필드 추천** (`/api/ai/suggest-fields`) - Owner only
  - OpenAI GPT-4o Mini, GPT-4o, GPT-4.1, GPT-5 시리즈 지원
  - Google Gemini 2.5 Flash, Pro, Lite 지원
  - 컬렉션 이름 기반 메타데이터 자동 생성
- ✅ **AI 모델 관리** (`/api/ai/models`, `/api/ai/set-models`) - Owner only
  - JSON 기반 모델 데이터베이스
  - 설정된 모델 자동 사용
  - 비용 계산 기능
- ✅ **웹 스크래핑 API** (`/api/scraper`) - Owner only
  - Playwright 기반 headless 브라우저 크롤링
  - 사이트별 특화 파싱 (교보문고, 알라딘)
  - 단일 URL 스크래핑 및 아이템 생성
  - CSV 일괄 등록 (진행 상황 추적)
  - 필드 매핑 시스템 (스크래핑 필드 → 사용자 필드)

### 데이터베이스 (하이브리드 아키텍처)
- ✅ **PostgreSQL** (메타데이터)
  - Collection: 컬렉션 정의 + `mongo_collection` 매핑 + `field_definitions` (JSONB) + `field_mapping` (JSONB)
- ✅ **MongoDB** (실제 데이터)
  - 동적 컬렉션: items_* (예: items_books, items_games)
  - collection_id로 PostgreSQL과 연결
  - metadata (Object): 자유로운 스키마 구조

### 백엔드 아키텍처
- ✅ **Service Layer Pattern**
  - API: 라우팅 및 요청/응답 처리만 담당
  - Service: 비즈니스 로직 구현
  - 서비스별 디렉토리 구조 (collection/, item/, ai/)
- ✅ **SQLAlchemy 2.0 스타일** - select() 패턴 사용

### 프론트엔드
- ✅ **Public 페이지** (조회 전용)
  - 메인 페이지: 컬렉션 카드 + 소유자 이름 (모던 디자인)
  - 컬렉션 아이템 목록 페이지: 그리드/리스트 뷰 전환, 검색, 정렬
- ✅ **Admin 페이지** (Owner only)
  - Google OAuth 로그인/로그아웃
  - 컬렉션 관리: 생성/수정/삭제 + AI 필드 추천
  - 아이템 관리: 생성/수정/삭제 + URL 스크래핑 + CSV 일괄 등록
  - AI 모델 설정 (텍스트/비전 모델 선택)
- ✅ **인증 시스템**
  - AuthContext: JWT 토큰 관리 (localStorage)
  - 인증 상태 전역 관리
- ✅ **컴포넌트**
  - CollectionModal: 컬렉션 생성/수정 모달 (이모지 피커 포함)
  - FieldDefinitionEditor: 필드 정의 테이블 에디터 (직접 추가/수정/삭제)
  - AIFieldSuggestion: AI 필드 추천 UI
  - ModelSelectionModal: AI 모델 선택 모달
  - ItemModal: 아이템 생성/수정 모달 (URL 스크래핑 모드 지원)
  - BulkImportModal: CSV 일괄 등록 모달 (실시간 진행 상황 표시)
  - FieldMappingModal: 필드 매핑 UI (자동/수동 매칭, 저장 옵션)
- ✅ **디자인 시스템 (Warehouse/Storage 테마)**
  - Amber/Slate/Stone 컬러 팔레트 (창고 느낌)
  - 그라디언트 배경 및 텍스트
  - Hover 애니메이션 (scale, rotate, shadow)
  - 반응형 그리드 레이아웃
  - 50개 이모지 프리셋 (5개 카테고리)

## 빠른 시작

### 필수 요구사항
- [mise](https://mise.jdx.dev/)
- [uv](https://docs.astral.sh/uv/)
- Docker & Docker Compose

### 1. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일 수정:
```bash
# PostgreSQL Database
POSTGRES_HOST=localhost       # Docker: postgres, Local: localhost
POSTGRES_PORT=5432           # 기본 5432 (포트 충돌 시 변경 가능)
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=mystorage

# MongoDB Database
MONGO_HOST=localhost         # Docker: mongodb, Local: localhost
MONGO_PORT=27017            # 기본 27017 (포트 충돌 시 변경 가능)
MONGO_USER=your_username
MONGO_PASSWORD=your_password
MONGO_DB=mystorage

# Auth
OWNER_EMAIL=your-email@gmail.com
OWNER_NAME=Your Name
SECRET_KEY=your-random-secret-key  # 생성: python -c "import secrets; print(secrets.token_urlsafe(32))"
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI (선택사항)
OPENAI_API_KEY=sk-proj-...  # https://platform.openai.com/api-keys
GEMINI_API_KEY=AIzaSy...    # https://aistudio.google.com/app/apikey

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_OWNER_NAME=Your Name
```

**주요 설정:**
- 데이터베이스 연결 정보는 호스트, 포트, 사용자, 비밀번호로 분리 관리
- `SECRET_KEY`: JWT 토큰 서명용 비밀키 (위 명령어로 생성)
- `OWNER_NAME` / `NEXT_PUBLIC_OWNER_NAME`: 메인 페이지에 "{이름}'s Storage"로 표시
- `OPENAI_API_KEY`, `GEMINI_API_KEY`: AI 필드 추천 기능 사용 시 필요 (선택사항)

### 2. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성
3. "API 및 서비스" > "사용자 인증 정보" 클릭
4. "OAuth 2.0 클라이언트 ID" 생성
   - 애플리케이션 유형: **웹 애플리케이션**
   - 승인된 JavaScript 원본: `http://localhost:3000`
   - 승인된 리디렉션 URI: `http://localhost:3000`
5. 클라이언트 ID와 시크릿을 `.env`에 복사

### 3. Docker로 실행

```bash
# 전체 서비스 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d --build
```

서비스 접속:
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서 (Swagger): http://localhost:8000/docs

### 4. 개발 환경 설정 (선택)

로컬에서 개발하려면:

```bash
# 개발 도구 설치
mise install

# Python 의존성 설치
uv sync

# 백엔드 실행
uv run uvicorn backend.app.main:app --reload

# 프론트엔드 실행 (별도 터미널)
cd frontend
npm install
npm run dev
```

## 프로젝트 구조

```
myStorage/
├── backend/
│   └── app/
│       ├── api/                      # API 라우터 (라우팅만)
│       │   ├── auth.py               # 인증
│       │   ├── collections.py        # 컬렉션 CRUD
│       │   ├── items.py              # 아이템 CRUD
│       │   ├── scraper.py            # 웹 스크래핑 & 필드 매핑
│       │   └── ai.py                 # AI 필드 추천 & 모델 관리
│       ├── services/                 # 비즈니스 로직
│       │   ├── collection/
│       │   │   └── collection_service.py
│       │   ├── item/
│       │   │   └── item_service.py
│       │   ├── scraper/
│       │   │   └── web_scraper.py    # Playwright 스크래핑
│       │   └── ai/
│       │       ├── settings.py              # AI 설정 관리
│       │       ├── field_suggestion_service.py
│       │       └── model_manager_service.py
│       ├── core/                     # 핵심 설정
│       │   ├── config.py             # 환경 변수
│       │   ├── auth.py               # JWT 인증
│       │   └── ai_model_manager.py   # AI 모델 관리
│       ├── data/                     # 데이터 파일
│       │   └── ai_models.json        # AI 모델 데이터베이스
│       ├── db/                       # 데이터베이스
│       │   ├── base.py               # PostgreSQL
│       │   └── mongodb.py            # MongoDB 연결
│       ├── models/                   # SQLAlchemy 모델
│       │   └── collection.py
│       ├── schemas/                  # Pydantic 스키마
│       │   ├── collection.py
│       │   ├── item.py
│       │   ├── scraper.py            # 스크래핑 관련 스키마
│       │   └── field_suggestion.py
│       └── main.py                   # FastAPI 앱
├── frontend/                         # Next.js 앱
│   ├── contexts/
│   │   └── AuthContext.tsx           # 인증 상태 관리
│   ├── components/                   # 공통 컴포넌트
│   │   ├── CollectionModal.tsx       # 컬렉션 생성/수정 모달
│   │   ├── FieldDefinitionEditor.tsx # 필드 정의 테이블 에디터
│   │   ├── AIFieldSuggestion.tsx     # AI 필드 추천 UI
│   │   ├── ModelSelectionModal.tsx   # AI 모델 선택 모달
│   │   ├── ItemModal.tsx             # 아이템 생성/수정 모달
│   │   ├── BulkImportModal.tsx       # CSV 일괄 등록 모달
│   │   └── FieldMappingModal.tsx     # 필드 매핑 UI
│   ├── hooks/                        # 커스텀 훅
│   │   └── useAISettings.ts          # AI 설정 관리 훅
│   ├── types/                        # TypeScript 타입
│   │   └── ai-models.ts              # AI 모델 타입 정의
│   ├── app/
│   │   ├── api/                      # Next.js API Routes (프록시)
│   │   │   ├── collections/          # 컬렉션 API 프록시
│   │   │   ├── items/                # 아이템 API 프록시
│   │   │   ├── scraper/              # 스크래핑 API 프록시
│   │   │   └── ai/                   # AI API 프록시
│   │   ├── collections/              # Public 페이지
│   │   │   └── [slug]/               # 컬렉션 아이템 목록
│   │   └── admin/                    # 관리자 페이지
│   │       └── collections/          # 컬렉션 관리 페이지
│   │           └── [slug]/items/     # 아이템 관리 페이지
│   └── lib/
│       └── api.ts                    # API 클라이언트
├── scripts/
│   └── reset_database.sh             # DB 초기화 스크립트
├── .mise.toml                        # 개발 도구 버전
├── pyproject.toml                    # Python 의존성
├── docker-compose.yml                # Docker 서비스 (PostgreSQL + MongoDB)
├── Dockerfile.backend
├── Dockerfile.frontend
├── COLLECTION_EXAMPLES.md            # 필드 정의 예시
├── AI_SETUP.md                       # AI 기능 설정 가이드
├── AUTHENTICATION.md                 # 인증 및 보안 가이드
├── DEVELOPMENT.md                    # 개발 진행 상황
└── README.md
```

## API 사용 예시

### 컬렉션 목록 조회 (Public)
```bash
curl http://localhost:8000/api/collections
```

### 컬렉션 생성 (Owner only)
```bash
curl -X POST http://localhost:8000/api/collections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "도서",
    "slug": "books",
    "description": "개인 소장 도서",
    "field_definitions": {
      "fields": [
        {"key": "author", "label": "저자", "type": "text"},
        {"key": "isbn", "label": "ISBN", "type": "text"}
      ]
    }
  }'
```

### AI 필드 추천 (Owner only)
```bash
curl -X POST http://localhost:8000/api/ai/suggest-fields \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection_name": "영화",
    "description": "개인 소장 영화 컬렉션"
  }'
```

### 동적 아이템 생성 (Owner only)
```bash
curl -X POST http://localhost:8000/api/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection_id": 1,
    "metadata": {
      "title": "클린 코드",
      "author": "로버트 C. 마틴",
      "isbn": "9788966260959"
    }
  }'
```

### 아이템 목록 조회 (Public)
```bash
curl http://localhost:8000/api/items?collection_id=1
```

### URL 스크래핑 (Owner only)
```bash
curl -X POST http://localhost:8000/api/scraper/scrape-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://product.kyobobook.co.kr/detail/S000001713046",
    "collection_id": 1,
    "apply_mapping": true
  }'
```

### 필드 매핑 저장 (Owner only)
```bash
curl -X POST http://localhost:8000/api/scraper/save-mapping \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection_id": 1,
    "mapping": {
      "title": "책제목",
      "author": "저자명",
      "publisher": "출판사명"
    },
    "ignore_unmapped": true
  }'
```

## 라우팅 구조

### Public (인증 불필요)
- `/` - 메인 페이지 (컬렉션 카드 그리드)
- `/collections/[slug]` - 컬렉션별 아이템 목록 (그리드/리스트 뷰, 검색, 정렬)

### Admin (소유자만 접근 가능)
- `/admin` - 관리 대시보드
  - 컬렉션 관리 링크
  - AI 모델 설정
- `/admin/collections` - 컬렉션 관리
  - 컬렉션 생성/수정/삭제
  - AI 필드 추천 기능
- `/admin/collections/[slug]/items` - 아이템 관리
  - 아이템 생성/수정/삭제
  - URL 스크래핑 기능
  - CSV 일괄 등록 (진행 상황 표시)
  - 필드 매핑 설정

## 데이터베이스 아키텍처

### 하이브리드 구조 (PostgreSQL + MongoDB)

#### PostgreSQL (메타데이터)
**Collection 테이블**
- `id`, `name`, `slug`, `icon`, `description`
- `mongo_collection` (String): MongoDB 컬렉션명 매핑
- `field_definitions` (JSONB): 메타데이터 필드 정의
  ```json
  {
    "fields": [
      {"key": "author", "label": "저자", "type": "text", "required": false},
      {"key": "category", "label": "카테고리", "type": "select", "options": ["소설", "기술서"]}
    ]
  }
  ```
- `field_mapping` (JSONB): 스크래핑 필드 매핑 설정
  ```json
  {
    "mapping": {
      "title": "책제목",
      "author": "저자명",
      "publisher": "출판사명"
    },
    "ignore_unmapped": true
  }
  ```

#### MongoDB (실제 데이터)
**동적 컬렉션** (예: items_books, items_board_games)
- `_id` (ObjectId): MongoDB 기본 ID
- `collection_id` (int): PostgreSQL Collection과 연결
- `metadata` (Object): 자유로운 스키마 구조
- `created_at`, `updated_at`

**장점:**
- PostgreSQL: 구조화된 메타데이터 관리
- MongoDB: 유연한 스키마로 다양한 컬렉션 타입 지원
- SQL Injection 방지: PostgreSQL 검증 후 MongoDB 접근

## AI 기능 설정

### OpenAI API 키 발급
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. `.env`에 `OPENAI_API_KEY` 추가

### Google Gemini API 키 발급
1. https://aistudio.google.com/app/apikey 접속
2. "Create API key" 클릭
3. `.env`에 `GEMINI_API_KEY` 추가

### 지원 모델
- **OpenAI**: GPT-4o Mini, GPT-4o, GPT-4.1, GPT-4.1 Mini/Nano, GPT-5, GPT-5 Mini/Nano
- **Google**: Gemini 2.5 Flash, Flash Lite, Pro

자세한 내용은 [AI_SETUP.md](./AI_SETUP.md)를 참고하세요.

## 보안 및 인증

### 인증 시스템 개요
- **Google OAuth 2.0** 기반 인증
- **소유자 이메일** 검증: `.env`의 `OWNER_EMAIL`과 일치하는 사용자만 관리 기능 접근
- **JWT 토큰** 기반 세션 관리

### API 보안
모든 관리 API는 백엔드에서 `require_owner` 의존성으로 보호됩니다:

- 🔒 **Owner only**: 컬렉션/아이템 생성/수정/삭제, AI 필드 추천, AI 모델 설정
- ✅ **Public**: 컬렉션/아이템 조회, AI 모델 목록

### 인증 흐름
```
사용자 → Google OAuth → 프론트엔드 → 백엔드 (JWT 발급) → localStorage 저장
```

자세한 내용은 [AUTHENTICATION.md](./AUTHENTICATION.md)를 참고하세요.

### 보안 주의사항
⚠️ 프론트엔드의 인증 체크는 UX 개선용이며, **실제 보안은 백엔드에서 처리**됩니다.
누구나 백엔드 API를 직접 호출할 수 있지만, 유효한 토큰이 없으면 401 Unauthorized 응답을 받습니다.

## 문제 해결

### 백엔드가 시작되지 않음
```bash
# 로그 확인
docker-compose logs backend

# 컨테이너 재시작
docker-compose restart backend
```

### MongoDB 연결 오류
```bash
# MongoDB 상태 확인
docker-compose ps mongodb

# MongoDB 로그 확인
docker-compose logs mongodb
```

### 프론트엔드 빌드 오류
```bash
# Node 모듈 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 데이터베이스 초기화
```bash
# 전체 데이터베이스 리셋 (주의: 모든 데이터 삭제)
bash scripts/reset_database.sh
```

### 401 Unauthorized 에러
```bash
# 원인: 인증 토큰이 없거나 유효하지 않음

# 해결 방법:
1. 로그아웃 후 다시 로그인
2. 브라우저 개발자 도구 → Application → Local Storage에서 'auth_token' 확인
3. 토큰이 만료되었을 수 있음 (다시 로그인)
```

### 403 Forbidden 에러
```bash
# 원인: 로그인한 이메일이 소유자 이메일과 다름

# 해결 방법:
1. .env 파일에서 OWNER_EMAIL 확인
2. 해당 이메일로 Google 로그인
```

## 다음 개발 계획

### 우선순위 1: 필드 매핑 로직 재설계 ⚠️
**현재 문제**: 스크래핑 결과 중심 매핑으로 인해 못 가져온 필드가 많음

**개선 방향**:
- 사용자 정의 메타 필드를 기준으로 UI 구성
- 각 사용자 필드마다 스크래핑 데이터 선택 매핑
- 스크래핑 못한 필드는 수동 입력 가능
- 예시:
  ```
  [사용자 필드: 책제목] ← [스크래핑: title 선택]
  [사용자 필드: 저자명] ← [스크래핑: author 선택]
  [사용자 필드: 가격]   ← [없음 → 수동 입력]
  ```

### 우선순위 2: 스크래핑 통합
1. **ItemModal에 필드 매핑 UI 통합**
   - URL 스크래핑 후 FieldMappingModal 자동 표시
   - 매핑 적용 후 폼에 자동 입력

2. **BulkImportModal에 필드 매핑 통합**
   - CSV 업로드 시 저장된 매핑 자동 적용

### 우선순위 3: 고급 기능
- 이미지 업로드 및 관리 시스템
- 검색 및 필터링 개선
- pgVector 활용 (유사 아이템 추천)

자세한 개발 진행 상황은 [DEVELOPMENT.md](./DEVELOPMENT.md)를 참고하세요.

## 라이선스

개인 프로젝트
