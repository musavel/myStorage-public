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
- **FastAPI** - Python 웹 프레임워크
- **SQLAlchemy** - ORM
- **PostgreSQL 17 + pgVector** - 메타데이터 및 컬렉션 정의 저장
- **MongoDB 7** - 동적 아이템 데이터 저장 (하이브리드 구조)
- **Motor** - Async MongoDB 드라이버
- **Google OAuth 2.0** - 인증
- **JWT (python-jose)** - 토큰 기반 인증
- **LangChain & LangGraph 1.0 alpha** - AI 기능
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
- ✅ **도서 관리 API** (`/api/books`) - 레거시 지원
- ✅ **보드게임 관리 API** (`/api/board-games`) - 레거시 지원
- ✅ **Google OAuth 인증** (`/api/auth/google`, `/api/auth/me`)
- ✅ **AI 필드 추천** (`/api/ai/suggest-fields`) - Owner only
  - OpenAI GPT-4o Mini, GPT-4o, GPT-4.1, GPT-5 시리즈 지원
  - Google Gemini 2.5 Flash, Pro, Lite 지원
  - 컬렉션 이름 기반 메타데이터 자동 생성
- ✅ **AI 모델 관리** (`/api/ai/models`, `/api/ai/set-models`) - Owner only
  - JSON 기반 모델 데이터베이스
  - 설정된 모델 자동 사용
  - 비용 계산 기능

### 데이터베이스 (하이브리드 아키텍처)
- ✅ **PostgreSQL** (메타데이터)
  - Collection: 컬렉션 정의 + `mongo_collection` 매핑 + `field_definitions` (JSONB)
  - Book, BoardGame: 레거시 테이블 (호환성 유지)
- ✅ **MongoDB** (실제 데이터)
  - 동적 컬렉션: items_books, items_board_games 등
  - collection_id로 PostgreSQL과 연결
  - metadata (JSONB): 자유로운 스키마 구조

### 프론트엔드
- ✅ **Public 페이지** (조회 전용)
  - 메인 페이지: 컬렉션 카드 + 소유자 이름
  - 도서 목록 페이지
  - 보드게임 목록 페이지
- ✅ **Admin 페이지** (Owner only)
  - Google OAuth 로그인/로그아웃
  - 도서 관리 (CRUD 완성)
  - 보드게임 관리 (CRUD 완성)
- ✅ **인증 시스템**
  - AuthContext: JWT 토큰 관리 (localStorage)
  - 인증 상태 전역 관리

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
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=mystorage

# MongoDB Database
MONGO_URL=mongodb://admin:admin@localhost:27017
MONGO_DB=mystorage
MONGO_USER=your_username
MONGO_PASSWORD=your_password

# Auth
OWNER_EMAIL=your-email@gmail.com
OWNER_NAME=Your Name
SECRET_KEY=your-random-secret-key  # 생성 명령: python -c "import secrets; print(secrets.token_urlsafe(32))"
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
- `SECRET_KEY`: JWT 토큰 서명용 비밀키 (위 명령어로 생성)
- `OWNER_NAME` / `NEXT_PUBLIC_OWNER_NAME`: 메인 페이지에 "{이름}'s Storage"로 표시됩니다
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
│       ├── api/                      # API 엔드포인트
│       │   ├── auth.py               # 인증
│       │   ├── collections.py        # 컬렉션 CRUD (MongoDB 연동)
│       │   ├── items.py              # 동적 아이템 CRUD
│       │   ├── ai.py                 # AI 필드 추천 & 모델 관리
│       │   ├── books.py              # 도서 (레거시)
│       │   └── board_games.py        # 보드게임 (레거시)
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
│       │   ├── collection.py
│       │   ├── book.py
│       │   └── board_game.py
│       ├── schemas/                  # Pydantic 스키마
│       └── main.py                   # FastAPI 앱
├── frontend/                         # Next.js 앱
│   ├── contexts/
│   │   └── AuthContext.tsx           # 인증 상태 관리
│   ├── app/
│   │   ├── admin/                    # 관리자 페이지
│   │   │   ├── books/                # 도서 관리
│   │   │   └── board-games/          # 보드게임 관리
│   │   ├── books/                    # Public 도서 목록
│   │   └── board-games/              # Public 보드게임 목록
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

## 라우팅 구조

### Public (인증 불필요)
- `/` - 메인 페이지
- `/books` - 도서 목록
- `/board-games` - 보드게임 목록

### Admin (소유자만 접근 가능)
- `/admin` - 관리 대시보드
- `/admin/books` - 도서 관리
- `/admin/board-games` - 보드게임 관리

## 데이터베이스 아키텍처

### 하이브리드 구조 (PostgreSQL + MongoDB)

#### PostgreSQL (메타데이터)
**Collection 테이블**
- `id`, `name`, `slug`, `icon`, `description`
- `mongo_collection` (String): MongoDB 컬렉션명 매핑
- `field_definitions` (JSONB): 메타데이터 필드 정의
- 예시:
  ```json
  {
    "fields": [
      {"key": "author", "label": "저자", "type": "text", "required": false},
      {"key": "category", "label": "카테고리", "type": "select", "options": ["소설", "기술서"]}
    ]
  }
  ```

**레거시 테이블 (호환성 유지)**
- `Book`: 기존 도서 정보
- `BoardGame`: 기존 보드게임 정보
- 향후 MongoDB로 마이그레이션 예정

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

## 다음 개발 계획

1. **동적 컬렉션 UI** - 프론트엔드에서 컬렉션 생성/관리
2. **AI 모델 선택 UI** - 관리자 페이지에서 AI 모델 설정
3. **검색 및 필터링** - 제목/메타데이터 검색, 카테고리 필터
4. **pgVector 활용** - 벡터 임베딩 기반 유사 아이템 추천

자세한 개발 진행 상황은 [DEVELOPMENT.md](./DEVELOPMENT.md)를 참고하세요.

## 라이선스

개인 프로젝트
