# 컬렉션 시스템

동적 컬렉션 관리 시스템

---

## 개요

사용자가 자유롭게 컬렉션 타입과 필드를 정의할 수 있는 시스템

### 특징
- 동적 필드 정의 (JSONB)
- MongoDB 동적 컬렉션 자동 생성
- Title 필드 필수
- AI 기반 필드 추천
- Slug 자동 생성 (DeepL 번역)
- 공개 여부 제어 (is_public)

---

## 데이터 구조

### PostgreSQL Collection 테이블
```sql
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    slug VARCHAR NOT NULL UNIQUE,
    mongo_collection VARCHAR UNIQUE,
    icon VARCHAR,
    description VARCHAR,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    field_definitions JSONB,
    field_mapping JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

### field_definitions 구조
```json
{
  "fields": [
    {
      "key": "title",
      "label": "제목",
      "type": "text",
      "required": true,
      "placeholder": "책 제목 입력"
    },
    {
      "key": "author",
      "label": "저자",
      "type": "text",
      "required": false
    },
    {
      "key": "category",
      "label": "카테고리",
      "type": "select",
      "required": false,
      "options": ["소설", "기술서", "에세이"]
    }
  ]
}
```

### MongoDB items_* 컬렉션
```javascript
{
  "_id": ObjectId("..."),
  "collection_id": 1,
  "is_public": true,
  "metadata": {
    "title": "클린 코드",
    "author": "로버트 C. 마틴",
    "category": "기술서"
  },
  "created_at": ISODate("..."),
  "updated_at": ISODate("...")
}
```

---

## 필드 타입

| Type | 설명 | 사용 예시 |
|------|------|-----------|
| `text` | 단일 텍스트 | 제목, 저자, ISBN |
| `textarea` | 여러 줄 텍스트 | 설명, 메모 |
| `number` | 숫자 | 가격, 페이지 수 |
| `date` | 날짜 | 구매일, 출판일 |
| `select` | 드롭다운 선택 | 카테고리, 장르 |

---

## Title 필드 시스템

### 필수 사항
- **모든 컬렉션에 title 필드 필수**
- 시스템에서 자동으로 추가
- 사용자가 삭제/수정 불가 (key, type, required)
- Label과 Placeholder만 수정 가능

### UI 분리
**필수 필드 섹션**:
- Title 필드만 표시
- 파란색 테두리
- 🔒 고정 배지
- Label/Placeholder만 수정 가능

**추가 필드 섹션**:
- Title 제외한 나머지 필드
- 자유롭게 추가/수정/삭제

### 보존 로직
- AI 필드 추천 시 title 필드 자동 보존
- 필드 추가/삭제 시 title 필드 유지
- MongoDB 저장 시 title 필드 검증

---

## 컬렉션 생성 흐름

```
1. 사용자 → CollectionModal 열기
2. 이름 입력 (예: "도서")
3. Slug 자동 생성 (DeepL: "도서" → "books")
4. AI 필드 추천 클릭 (선택)
   → OpenAI/Gemini로 필드 자동 생성
   → title 필드 자동 포함
5. 필드 수동 편집 (추가/수정/삭제)
6. 저장 → PostgreSQL + MongoDB 컬렉션 생성
```

---

## 슬러그 생성

### 자동 생성 (DeepL)
```
"도서" → "books"
"LP 레코드" → "lp-records"
"보드게임" → "board-games"
```

### DeepL API 미설정 시
- **모달 열릴 때 DeepL 가용성 자동 체크**
- DeepL 없으면:
  - "DeepL 번역" 버튼 숨김
  - Slug 필드 필수 입력 (빨간 테두리)
  - 경고 메시지: "⚠️ DeepL API가 설정되지 않았습니다. 영문 슬러그를 직접 입력해주세요"
  - 저장 시 slug 없으면 에러

### 수동 입력
- "고급 옵션 표시" 토글
- 직접 slug 입력 가능
- URL-safe 검증 (소문자, 하이픈만)

### Fallback (저장 시 자동 생성)
- DeepL 있고 slug 비어있으면 저장 시 자동 생성
- 번역 실패 시 MD5 해시
- 예: `collection-a3f4b2c1`

---

## MongoDB 컬렉션 매핑

### 영문 Slug
```
slug: "books"
→ mongo_collection: "items_books"
```

### 한글 Slug (MD5 해시)
```
slug: "도서"
→ ASCII가 아님 감지
→ MD5 해시: "a3f4b2c1..."
→ mongo_collection: "items_a3f4b2c1"
```

### SQL Injection 방지
1. PostgreSQL에서 Collection 검증
2. mongo_collection 값 확인
3. 검증된 값으로만 MongoDB 접근

---

## AI 필드 추천

### 사용 방법
1. CollectionModal에서 "AI 추천" 버튼 클릭
2. AI가 컬렉션 이름 기반 필드 생성
3. title 필드 자동 제외 (시스템 필수 필드)
4. 생성된 필드를 테이블에 표시
5. 수동으로 추가 편집 가능

### 추천 예시
```
컬렉션 이름: "LP 레코드"

추천 필드:
- artist (아티스트, text)
- album (앨범, text)
- genre (장르, select: ["록", "팝", "재즈", ...])
- rpm (RPM, select: ["33", "45", "78"])
- label (레이블, text)
- release_year (발매년도, number)
- condition (상태, select)
- purchase_date (구매일, date)
- purchase_price (구매가격, number)
- location (보관위치, text)
- notes (메모, textarea)
```

---

## API 엔드포인트

### 컬렉션 CRUD
```bash
# 목록 조회 (Owner는 모든 항목, 일반 사용자는 공개 항목만)
GET /api/collections

# 단일 조회 (Public)
GET /api/collections/{id}

# 생성 (Owner only)
POST /api/collections
{
  "name": "도서",
  "slug": "",  # 비어있으면 자동 생성
  "icon": "📚",
  "description": "개인 소장 도서",
  "is_public": true,  # 공개 여부 (기본값: true)
  "field_definitions": {...}
}

# 수정 (Owner only)
PUT /api/collections/{id}
{
  "name": "도서",
  "is_public": false  # 비공개로 변경
}

# 삭제 (Owner only)
DELETE /api/collections/{id}
```

---

## 관련 문서

- [AI 모델 시스템](./ai-models.md)
- [컬렉션 예시 가이드](../guides/collection-examples.md)
- [Changelog](../changelog/)
