# 개발 진행 상황

## 프로젝트 개요
개인 소장품 관리 시스템 (도서, 보드게임 등)

## 현재까지 완료된 작업

### 1. 개발 환경 구축
- ✅ mise 설치 및 설정 (Python 3.12, Node 22, PostgreSQL 17)
- ✅ uv로 Python 패키지 관리
- ✅ Docker Compose 환경 구성 (PostgreSQL + MongoDB)
- ✅ Next.js 프론트엔드 초기 설정

### 2. 데이터베이스 아키텍처 (MongoDB 하이브리드)
#### PostgreSQL (메타데이터)
- ✅ **Collection (컬렉션)**
  - 기본 정보: id, name, slug, icon, description
  - `mongo_collection`: MongoDB 컬렉션명 매핑
  - `field_definitions` (JSONB): 메타데이터 필드 정의

#### MongoDB (실제 데이터)
- ✅ **동적 컬렉션**: items_books, items_board_games 등
  - collection_id로 PostgreSQL과 연결
  - metadata (JSONB): 자유로운 스키마 구조
  - created_at, updated_at

#### 레거시 테이블 (호환성 유지)
- ✅ **Book (도서)**: 기존 구조 유지
- ✅ **BoardGame (보드게임)**: 기존 구조 유지
- 📝 향후 MongoDB로 마이그레이션 예정

### 3. 백엔드 API (FastAPI)
#### 인증 시스템
- ✅ Google OAuth 2.0 인증
  - JWT 토큰 기반 (python-jose)
  - 소유자 이메일만 편집 가능
  - `require_owner` 의존성 함수

#### RESTful API
- ✅ `/api/collections` - 컬렉션 CRUD (Owner only)
  - MongoDB 컬렉션 자동 생성/삭제
  - slug → mongo_collection 자동 매핑
  - SQL Injection 방지 검증
- ✅ `/api/items` - 아이템 CRUD (동적 컬렉션)
  - GET `/items?collection_id={id}` - 목록 조회
  - POST `/items` - 생성 (Owner only)
  - PUT/DELETE `/items/{collection_id}/{item_id}` (Owner only)
- ✅ `/api/books` - 도서 CRUD (레거시)
- ✅ `/api/board-games` - 보드게임 CRUD (레거시)
- ✅ `/api/auth/google` - Google OAuth 로그인
- ✅ `/api/auth/me` - 현재 사용자 정보

#### AI 기능 (LangChain & LangGraph 1.0 alpha)
- ✅ `/api/ai/suggest-fields` - AI 필드 추천 (Owner only)
  - OpenAI GPT-4o Mini 지원
  - Google Gemini 2.0 Flash 지원
  - 컬렉션 이름 기반 메타데이터 자동 생성
- ✅ `/api/ai/models` - AI 모델 목록 조회
- ✅ `/api/ai/set-models` - AI 모델 설정 (Owner only)
- ✅ `/api/ai/get-models` - 현재 설정 조회

#### AI 모델 관리 시스템
- ✅ AIModelManager: JSON 기반 모델 데이터베이스
  - `backend/app/data/ai_models.json`
  - OpenAI: GPT-4o Mini, GPT-4o, GPT-4.1, GPT-5 시리즈
  - Google: Gemini 2.5 Flash, Pro, Lite
  - 가격 정보, 모달리티 정보 포함
- ✅ 설정된 모델 자동 사용
- ✅ 비용 계산 기능

### 4. 프론트엔드 (Next.js)
#### 인증 시스템
- ✅ Google OAuth 클라이언트 통합 (@react-oauth/google)
- ✅ AuthContext: JWT 토큰 관리 (localStorage)
- ✅ 인증 상태 전역 관리

#### 라우팅 구조
- **Public (조회 전용)** ✅
  - `/` - 메인 페이지 (컬렉션 카드)
  - `/books` - 도서 목록
  - `/board-games` - 보드게임 목록

- **Admin (Owner only)** ✅
  - `/admin` - 관리 대시보드 (Google 로그인)
  - `/admin/books` - 도서 관리 (CRUD 완성)
  - `/admin/board-games` - 보드게임 관리 (CRUD 완성)

#### 구현된 기능
- ✅ Google Sign-In 버튼 통합
- ✅ 로그인/로그아웃 기능
- ✅ 도서/보드게임 CRUD 폼 (모달)
- ✅ API 통신 라이브러리 with 인증 헤더
- ✅ Black & White 테마

#### 디자인 시스템
- 컬러: White background, Black text, Gray borders
- 타이포그래피: System fonts
- 레이아웃: Responsive grid (1/2/3 columns)
- 인터랙션: Hover 시 border color 변경

## 다음 작업 예정

### 우선순위 1: Admin 기능 완성
1. **Google OAuth 클라이언트 구현**
   - Google Sign-In 버튼 통합
   - JWT 토큰 관리 (localStorage/cookie)
   - 인증 상태 관리 (Context API)

2. **Admin CRUD 페이지**
   - 도서 관리: 추가/수정/삭제 폼
   - 보드게임 관리: 추가/수정/삭제 폼
   - 이미지 업로드 (선택)

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
- Python 3.12
- FastAPI
- SQLAlchemy
- PostgreSQL 17 + pgVector
- Google OAuth 2.0
- JWT (python-jose)

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
