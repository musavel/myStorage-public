# 개발 가이드

myStorage 개발 정보 및 기여 가이드

---

## 프로젝트 개요

**myStorage**는 개인 소장품을 체계적으로 관리하는 웹 애플리케이션입니다.

### 핵심 특징
- 🗄️ PostgreSQL + MongoDB 하이브리드 아키텍처
- 🤖 AI 기반 필드 추천 (LangChain & LangGraph 1.0 alpha)
- 🌐 웹 스크래핑 (Playwright)
- 🔐 Google OAuth 2.0 인증
- 📦 Docker 기반 개발/배포

---

## 개발 환경 설정

### 필수 요구사항
- [mise](https://mise.jdx.dev/) - 개발 도구 버전 관리
- [uv](https://docs.astral.sh/uv/) - Python 패키지 관리
- Docker & Docker Compose

### 로컬 개발 시작

```bash
# 1. 개발 도구 설치
mise install

# 2. Python 의존성 설치
uv sync

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (DB, OAuth, AI API 키 등)

# 4. Docker 서비스 시작
docker-compose up -d postgres mongodb

# 5. 백엔드 실행
uv run uvicorn backend.app.main:app --reload

# 6. 프론트엔드 실행 (별도 터미널)
cd frontend
npm install
npm run dev
```

---

## 기술 스택 상세

### 백엔드
- **Python 3.13** (LangGraph 1.0 alpha 요구사항)
- **FastAPI** - 고성능 Python 웹 프레임워크
- **SQLAlchemy 2.0** - ORM (select() 패턴 사용)
- **Alembic** - 데이터베이스 마이그레이션
- **Motor** - Async MongoDB 드라이버

### 프론트엔드
- **Next.js 14 App Router** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - Utility-first CSS
- **Warehouse 테마** - Amber/Slate/Stone 컬러

### 인프라
- **Docker Compose** - 로컬 개발 환경
- **mise** - Python, Node 버전 관리
- **uv** - 빠른 Python 패키지 설치

---

## 아키텍처 패턴

### Service Layer Pattern
```
Client → API Router → Service Layer → Database
```

- **API Router**: 라우팅, 요청/응답 처리
- **Service Layer**: 비즈니스 로직
- **Database**: PostgreSQL (메타데이터) + MongoDB (아이템)

### 디렉토리 구조
```
backend/app/
├── api/         # FastAPI 라우터
├── services/    # 비즈니스 로직
├── models/      # SQLAlchemy 모델
├── schemas/     # Pydantic 스키마
└── core/        # 핵심 설정 (config, auth)
```

---

## 데이터베이스

### 마이그레이션
```bash
# 새 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 마이그레이션 적용
alembic upgrade head

# 롤백
alembic downgrade -1
```

### PostgreSQL
- Collection: 컬렉션 정의 및 필드 스키마
- UserSettings: AI 모델 설정 등 사용자 설정

### MongoDB
- items_*: 동적 컬렉션 (컬렉션별로 별도 collection)
- 유연한 스키마 구조

---

## 코딩 컨벤션

### Python (Backend)
```python
# SQLAlchemy 2.0 스타일
from sqlalchemy import select

stmt = select(Collection).where(Collection.slug == slug)
result = db.execute(stmt).scalar_one_or_none()

# Service Layer 패턴
# api/collections.py
@router.post("/")
async def create_collection(
    data: CollectionCreate,
    db: Session = Depends(get_db)
):
    return await collection_service.create(db, data)

# services/collection/collection_service.py
async def create(db: Session, data: CollectionCreate):
    # 비즈니스 로직
    pass
```

### TypeScript (Frontend)
```typescript
// API 호출
const response = await fetch('/api/collections', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 타입 안전성
interface Collection {
  id: number;
  name: string;
  field_definitions: FieldDefinition[];
}
```

---

## 테스트

### 백엔드 테스트
```bash
# 전체 테스트
uv run pytest

# 특정 테스트
uv run pytest tests/test_collections.py

# 커버리지
uv run pytest --cov=backend
```

### 프론트엔드 테스트
```bash
cd frontend
npm test
```

---

## API 개발

### 새 엔드포인트 추가
1. `backend/app/schemas/` - Pydantic 스키마 정의
2. `backend/app/services/` - 비즈니스 로직 구현
3. `backend/app/api/` - 라우터 추가
4. `backend/app/main.py` - 라우터 등록

### 인증 필요 API
```python
from backend.app.core.auth import require_owner

@router.post("/")
async def protected_endpoint(
    email: str = Depends(require_owner)  # 소유자만 접근
):
    pass
```

---

## 배포

### Docker 빌드
```bash
docker-compose up --build -d
```

### 환경 변수
프로덕션 환경에서는 다음 환경 변수 필수:
- `SECRET_KEY` - JWT 서명용 (강력한 랜덤 키)
- `OWNER_EMAIL` - 소유자 이메일
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth
- `OPENAI_API_KEY` 또는 `GEMINI_API_KEY` - AI 기능
- `DEEPL_API_KEY` - Slug 번역

---

## 문서

### 문서 구조
```
docs/
├── README.md           # 문서 인덱스
├── ARCHITECTURE.md     # 시스템 아키텍처
├── DEVELOPMENT.md      # 이 파일 (개발 가이드)
├── changelog/          # 일별 변경 이력
├── features/           # 기능별 상세 문서
└── guides/             # 사용자 가이드
```

### 새 기능 문서화
1. `docs/features/` 에 기능 문서 작성
2. `docs/changelog/YYYY-MM-DD.md` 에 변경 이력 추가
3. `docs/README.md` 에 링크 추가

---

## 변경 이력

상세한 개발 일지는 [Changelog](./changelog/README.md)를 참고하세요.

### 최근 업데이트
- [2025-10-10](./changelog/2025-10-10.md) - AI 설정 DB 관리 & 문서 구조 개편
- [2025-10-09](./changelog/2025-10-09.md) - 스크래핑 개선 & 매핑 시스템 고도화
- [2025-10-08](./changelog/2025-10-08.md) - UI/UX 개선 & Title 필수화

---

## 기여 가이드

### 이슈 보고
- GitHub Issues에 버그/기능 요청 작성
- 재현 단계 및 환경 정보 포함

### 코드 기여
1. Fork 후 브랜치 생성
2. 코드 작성 및 테스트
3. Pull Request 제출
4. 리뷰 후 병합

---

## 문제 해결

### 자주 발생하는 문제
- [DB 초기화](../scripts/reset_database.sh)
- [인증 문제](./guides/authentication.md)
- [AI 설정](./guides/ai-setup.md)

### 디버깅
```bash
# 백엔드 로그
docker-compose logs -f backend

# 프론트엔드 로그
npm run dev  # 터미널 출력 확인
```

---

## 관련 링크

- [프로젝트 README](../README.md)
- [시스템 아키텍처](./ARCHITECTURE.md)
- [문서 인덱스](./README.md)
- [Changelog](./changelog/README.md)
