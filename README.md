# myStorage

개인 소장품 관리 시스템 (도서, 보드게임 등)

## 프로젝트 소개

개인 소장 도서와 보드게임을 체계적으로 관리할 수 있는 웹 애플리케이션입니다.
- **조회 기능**: 누구나 소장품 목록을 볼 수 있습니다
- **관리 기능**: Google OAuth로 인증된 소유자만 편집 가능합니다

## 기술 스택

### 백엔드
- **FastAPI** - Python 웹 프레임워크
- **SQLAlchemy** - ORM
- **PostgreSQL 17 + pgVector** - 데이터베이스 (향후 벡터 검색 활용 예정)
- **Google OAuth 2.0** - 인증
- **JWT** - 토큰 기반 인증

### 프론트엔드
- **Next.js 14** - React 프레임워크
- **TypeScript**
- **Tailwind CSS** - 스타일링

### 인프라
- **Docker & Docker Compose** - 컨테이너화
- **mise** - 개발 도구 버전 관리
- **uv** - Python 패키지 관리

## 현재 구현된 기능

### 백엔드 API
- ✅ 컬렉션 관리 API (`/api/collections`)
- ✅ 도서 관리 API (`/api/books`)
- ✅ 보드게임 관리 API (`/api/board-games`)
- ✅ Google OAuth 인증 (`/api/auth/google`)
- ✅ 소유자 권한 검증

### 데이터베이스
- ✅ Collection 테이블 (컬렉션 타입 관리)
- ✅ Book 테이블 (도서 정보)
- ✅ BoardGame 테이블 (보드게임 정보)
- ✅ 외래키 관계 설정

### 프론트엔드
- ✅ Public 페이지 (조회 전용)
  - 메인 페이지: 컬렉션 카드 + 아이템 수 + 소유자 이름
  - 도서 목록 페이지
  - 보드게임 목록 페이지
- ✅ Admin 로그인 페이지 (UI)
- ✅ Docker 네트워크 환경 대응 (SSR/CSR 주소 분기)
- ⏳ Google OAuth 통합 (진행 중)
- ⏳ Admin CRUD 페이지 (진행 중)

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
# Database
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=mystorage

# Auth
OWNER_EMAIL=your-email@gmail.com
OWNER_NAME=Your Name
SECRET_KEY=your-random-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_OWNER_NAME=Your Name
```

**주요 설정:**
- `OWNER_NAME` / `NEXT_PUBLIC_OWNER_NAME`: 메인 페이지에 "{이름}'s Storage"로 표시됩니다

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
│       ├── api/              # API 엔드포인트
│       │   ├── auth.py       # 인증
│       │   ├── collections.py
│       │   ├── books.py
│       │   └── board_games.py
│       ├── core/             # 핵심 설정
│       │   ├── config.py     # 환경 변수
│       │   └── auth.py       # JWT 인증
│       ├── db/               # 데이터베이스
│       │   └── base.py
│       ├── models/           # SQLAlchemy 모델
│       │   ├── collection.py
│       │   ├── book.py
│       │   └── board_game.py
│       ├── schemas/          # Pydantic 스키마
│       └── main.py           # FastAPI 앱
├── frontend/                 # Next.js 앱
├── .mise.toml               # 개발 도구 버전
├── pyproject.toml           # Python 의존성
├── docker-compose.yml       # Docker 서비스
├── Dockerfile.backend
├── Dockerfile.frontend
├── DEVELOPMENT.md           # 개발 진행 상황
└── README.md
```

## API 사용 예시

### 컬렉션 목록 조회
```bash
curl http://localhost:8000/api/collections
```

### 도서 추가 (인증 필요)
```bash
curl -X POST http://localhost:8000/api/books \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "클린 코드",
    "collection_id": 1,
    "author": "로버트 C. 마틴",
    "publisher": "인사이트",
    "isbn": "9788966260959"
  }'
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

## 데이터베이스 스키마

### Collection (컬렉션)
도서, 보드게임 등 타입 관리
- `id`, `name`, `slug`, `icon`, `description`

### Book (도서)
- 기본 정보: `title`, `author`, `publisher`, `isbn`
- 상세: `description`, `image_url`, `published_date`, `page_count`
- 분류: `category` (장르/분류)
- 소장 정보: `purchase_date`, `purchase_price`, `location`, `notes`

### BoardGame (보드게임)
- 기본 정보: `title`, `designer`, `publisher`, `year_published`
- 게임 정보: `min/max_players`, `min/max_playtime`, `min_age`, `complexity`
- 분류: `category` (장르/분류)
- 소장 정보: `purchase_date`, `purchase_price`, `location`, `expansion`, `notes`

## 문제 해결

### 백엔드가 시작되지 않음
```bash
# 로그 확인
docker-compose logs backend

# 컨테이너 재시작
docker-compose restart backend
```

### 프론트엔드 빌드 오류
```bash
# Node 모듈 재설치
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 데이터베이스 연결 오류
- `.env` 파일의 데이터베이스 설정 확인
- PostgreSQL 컨테이너 상태 확인: `docker-compose ps`

## 다음 개발 계획

1. **프론트엔드 Public 페이지** - 조회 전용 UI
2. **프론트엔드 Admin 페이지** - 관리 UI + Google 로그인
3. **pgVector 활용** - RAG 기반 검색 및 유사 아이템 추천

자세한 개발 진행 상황은 [DEVELOPMENT.md](./DEVELOPMENT.md)를 참고하세요.

## 라이선스

개인 프로젝트
