# 개발 진행 상황

## 프로젝트 개요
개인 소장품 관리 시스템 (도서, 보드게임 등)

## 현재까지 완료된 작업

### 1. 개발 환경 구축
- ✅ mise 설치 및 설정 (Python 3.12, Node 22, PostgreSQL 17)
- ✅ uv로 Python 패키지 관리
- ✅ Docker Compose 환경 구성
- ✅ Next.js 프론트엔드 초기 설정

### 2. 데이터베이스 설계
- ✅ **Collection (컬렉션)**: 도서, 보드게임 등 카테고리 관리
- ✅ **Book (도서)**: 도서 전용 테이블
  - collection_id (외래키)
  - 기본 정보: title, author, publisher, isbn
  - 상세 정보: description, image_url, published_date, page_count
  - 소장 정보: purchase_date, purchase_price, location, notes
  - category (문자열): 장르/분류 (소설, 기술서 등)
- ✅ **BoardGame (보드게임)**: 보드게임 전용 테이블
  - collection_id (외래키)
  - 기본 정보: title, designer, publisher, year_published
  - 게임 정보: min/max_players, min/max_playtime, min_age, complexity
  - 소장 정보: purchase_date, purchase_price, location, expansion, notes
  - category (문자열): 장르/분류

### 3. 백엔드 API (FastAPI)
- ✅ SQLAlchemy ORM 모델
- ✅ Pydantic 스키마 (Create, Update, Response)
- ✅ RESTful API 엔드포인트
  - `/api/collections` - 컬렉션 CRUD
  - `/api/books` - 도서 CRUD
  - `/api/board-games` - 보드게임 CRUD
  - `/api/auth/google` - Google OAuth 로그인
  - `/api/auth/me` - 현재 사용자 정보
- ✅ CORS 설정
- ✅ Google OAuth 인증 시스템
  - JWT 토큰 기반 인증
  - 소유자 이메일만 편집 가능
  - `require_owner` 의존성 함수

### 4. 프론트엔드 (Next.js)
#### 라우팅 구조
- **Public (조회 전용)** ✅
  - `/` - 메인 페이지 (컬렉션 카드 with 아이템 수)
  - `/books` - 도서 목록
  - `/board-games` - 보드게임 목록

- **Admin (편집 가능, 로그인 필요)** ✅ 기본 구조
  - `/admin` - 로그인 페이지
  - `/admin/books` - 도서 관리 (CRUD) - 예정
  - `/admin/board-games` - 보드게임 관리 (CRUD) - 예정

#### 구현된 기능
- ✅ Black & White 테마 적용
- ✅ API 통신 라이브러리 (`lib/api.ts`)
  - Docker 네트워크 내부/외부 주소 자동 분기
  - SSR: `http://backend:8000`
  - CSR: `http://localhost:8000`
- ✅ 메인 페이지: 컬렉션 카드 표시, 아이템 수 카운트
  - 소유자 이름 개인화 (`{OWNER_NAME}'s Storage`)
- ✅ 도서 목록 페이지: 그리드 레이아웃, 이미지/메타데이터 표시
- ✅ 보드게임 목록 페이지: 그리드 레이아웃, 게임 정보 표시
- ✅ Admin 로그인 페이지 (UI만)

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
