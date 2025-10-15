# 시스템 아키텍처

## 개요

myStorage는 개인 소장품을 체계적으로 관리하는 웹 애플리케이션으로, PostgreSQL + MongoDB 하이브리드 아키텍처를 사용합니다.

---

## 기술 스택

### 백엔드
- **Python 3.13**
- **FastAPI** - 웹 프레임워크
- **SQLAlchemy 2.0** - ORM (select() 패턴)
- **PostgreSQL 17** - 메타데이터 저장
- **MongoDB 7** - 동적 아이템 데이터 저장
- **Motor** - Async MongoDB 드라이버
- **Alembic** - 데이터베이스 마이그레이션
- **LangChain 0.3+** - AI 통합
- **LangGraph 1.0 alpha** - AI 오케스트레이션
- **OpenAI / Google Gemini** - LLM
- **DeepL API** - 번역
- **Playwright** - 웹 스크래핑

### 프론트엔드
- **Next.js 15** - React 프레임워크 (App Router)
- **TypeScript**
- **Tailwind CSS** - 스타일링
- **@react-oauth/google** - OAuth 클라이언트

### 인프라
- **Docker & Docker Compose** - 컨테이너화
- **mise** - 개발 도구 버전 관리
- **uv** - Python 패키지 관리

---

## 아키텍처 패턴

### 1. 하이브리드 데이터베이스 구조

#### PostgreSQL (메타데이터)
- **Collection 테이블**: 컬렉션 정의
  - 기본 정보: name, slug, icon, description
  - MongoDB 매핑: mongo_collection (String)
  - 필드 정의: field_definitions (JSONB)
  - 스크래핑 설정: field_mapping (JSONB)

- **UserSettings 테이블**: 사용자 설정
  - user_email (unique)
  - ai_text_model, ai_vision_model
  - 여러 기기에서 동일한 설정 공유

#### MongoDB (실제 데이터)
- **동적 컬렉션**: items_* (예: items_books, items_games)
  - collection_id: PostgreSQL Collection 참조
  - metadata: 자유로운 스키마 (Object)
  - created_at, updated_at

#### 장점
- PostgreSQL: 구조화된 메타데이터 관리, SQL Injection 방지
- MongoDB: 유연한 스키마로 다양한 컬렉션 타입 지원
- 강력한 검증: PostgreSQL 검증 후 MongoDB 접근

---

### 2. Service Layer Pattern

```
Client → API Router → Service Layer → Database
         (라우팅)    (비즈니스 로직)   (데이터)
```

#### 디렉토리 구조
```
backend/app/
├── api/                    # API 라우터 (라우팅만)
│   ├── collections.py
│   ├── items.py
│   ├── scraper.py
│   └── ai.py
├── services/               # 비즈니스 로직
│   ├── collection/
│   │   └── collection_service.py
│   ├── item/
│   │   └── item_service.py
│   ├── scraper/
│   │   └── web_scraper.py
│   └── ai/
│       ├── settings.py
│       ├── field_suggestion_service.py
│       └── translation_service.py
├── models/                 # SQLAlchemy 모델
├── schemas/                # Pydantic 스키마
└── core/                   # 핵심 설정
```

#### 장점
- 관심사 분리 (Separation of Concerns)
- 테스트 용이성
- 재사용성

---

### 3. 인증 시스템

#### Google OAuth 2.0 흐름
```
1. 사용자 → Google OAuth → 프론트엔드
2. 프론트엔드 → 백엔드 (/api/auth/google) → JWT 발급
3. 프론트엔드 → localStorage에 토큰 저장
4. 이후 요청 → Authorization: Bearer {token}
```

#### 소유자 권한 검증
- `require_owner` 의존성: OWNER_EMAIL과 일치하는지 검증
- 🔒 Owner only: 컬렉션/아이템 생성/수정/삭제, AI 기능
- ✅ Public: 조회 기능

---

### 4. AI 시스템

#### AI 모델 관리
- **모델 데이터베이스**: backend/app/data/ai_models.json
- **설정 저장**: PostgreSQL user_settings 테이블
- **지원 모델**:
  - OpenAI: GPT-4o Mini, GPT-4o, GPT-4.1, GPT-5 시리즈
  - Google Gemini: 2.5 Flash, Pro, Lite

#### AI 기능
1. **필드 추천** (LangChain + LangGraph)
   - 컬렉션 이름 → AI 필드 자동 생성
   - title 필드 자동 제외 (시스템 필수 필드)

2. **Slug 번역** (DeepL API)
   - 한글/다국어 → 영문 slug 자동 변환
   - AI 모델 설정 불필요

#### 저장 형식
- DB: `"provider/model_id"` (예: `"openai/gpt-4o-mini"`)
- API: `{"provider": "openai", "model_id": "gpt-4o-mini"}`

---

### 5. 웹 스크래핑 시스템

#### Playwright 기반 크롤링
- Headless 브라우저로 JavaScript 렌더링 페이지 처리
- BeautifulSoup으로 HTML 파싱
- Context manager 패턴으로 리소스 관리

#### 사이트별 특화 파싱
- **교보문고** (kyobobook.co.kr)
  - 제목, 저자, 출판사, ISBN, 가격, 설명, 카테고리, 쪽수
- **알라딘** (aladin.co.kr)
  - 제목, 저자(복수), 출판사, ISBN, 가격, 설명, 쪽수

#### 필드 매핑 시스템
- 스크래핑 필드 → 사용자 정의 필드 자동 매핑
- PostgreSQL에 매핑 설정 저장 (field_mapping JSONB)
- ignore_unmapped: 매핑 안 된 필드 처리 방식

---

## 데이터 흐름

### 컬렉션 생성
```
1. 사용자 → CollectionModal (이름 입력)
2. AI 필드 추천 (선택)
3. POST /api/collections
4. PostgreSQL: Collection 레코드 생성
5. MongoDB: items_{slug} 컬렉션 생성
```

### 아이템 추가 (스크래핑)
```
1. 사용자 → ItemModal (URL 입력)
2. POST /api/scraper/scrape-url
3. Playwright: 페이지 크롤링
4. 필드 매핑 적용
5. POST /api/items
6. MongoDB: items_* 컬렉션에 저장
```

### 아이템 조회
```
1. GET /api/items?collection_id=1
2. PostgreSQL: Collection 조회 (field_definitions)
3. MongoDB: items_* 컬렉션에서 데이터 조회
4. 응답: 필드 정의 + 아이템 목록
```

---

## 보안

### SQL Injection 방지
1. PostgreSQL에서 Collection 검증
2. mongo_collection 값 검증 후 MongoDB 접근
3. 사용자 입력을 직접 컬렉션명으로 사용하지 않음

### 인증
- 백엔드에서 JWT 검증 (`require_owner`)
- 프론트엔드 인증은 UX 개선용 (실제 보안은 백엔드)

### API Key 관리
- 환경 변수로 관리 (.env)
- Docker secrets 사용 권장 (프로덕션)

---

## 성능 고려사항

### MongoDB 인덱스
- collection_id: 빠른 필터링
- created_at: 정렬 최적화

### PostgreSQL
- slug, name: unique 인덱스
- user_email: unique 인덱스 (UserSettings)

### Next.js
- SSR: 초기 로딩 속도
- CSR: 동적 상호작용

---

## 확장성

### 수평 확장
- MongoDB: Sharding 가능
- PostgreSQL: Read Replica

### 기능 확장
- UserSettings 테이블로 다양한 사용자 설정 추가 가능
- field_definitions (JSONB)로 동적 필드 타입 추가 가능
- 새로운 스크래핑 사이트 추가 용이

---

## 관련 문서

- [월별 변경 이력](./changelog/)
- [기능별 상세 문서](./features/)
- [사용자 가이드](./guides/)
