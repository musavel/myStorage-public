# 필드 매핑 시스템

스크래핑 필드 → 사용자 정의 필드 자동 매핑

---

## 개요

웹 스크래핑으로 가져온 데이터의 필드명을 사용자가 정의한 필드명으로 자동 변환하는 시스템

### 문제
- 교보문고: `author` → 사용자 필드: `저자명`
- 알라딘: `author` → 사용자 필드: `저자`
- 스크래핑 필드명과 사용자 필드명이 다름

### 해결
- 필드 매핑 설정을 DB에 저장
- 스크래핑 후 자동으로 매핑 적용
- 한 번 설정하면 다음 스크래핑에도 자동 적용

---

## 저장 위치

PostgreSQL `collections` 테이블의 `field_mapping` (JSONB) 컬럼

```json
{
  "mapping": {
    "title": "책제목",
    "author": "저자명",
    "publisher": "출판사명",
    "isbn": "ISBN"
  },
  "ignore_unmapped": true
}
```

---

## 매핑 옵션

### ignore_unmapped
- **true** (추천): 매핑된 필드만 저장
  - 예: `title`, `author` 매핑 → 이 두 필드만 저장
  - 장점: 깔끔, 예측 가능

- **false**: 모든 필드 저장
  - 매핑된 필드는 변환, 나머지는 원래 키로 저장
  - 예: `title` → `책제목`, `description` → `description`

---

## 사용 흐름

### 1. 최초 스크래핑
```
1. ItemModal → URL 입력 → 스크래핑
2. FieldMappingModal 자동 열림
3. 자동 매칭 (정확히 일치, 유사 이름)
4. 수동으로 드롭다운에서 선택
5. "매핑되지 않은 필드 무시" 체크
6. "이 매핑 설정을 저장" 체크 → 저장
```

### 2. 이후 스크래핑 (매핑 저장됨)
```
1. ItemModal → URL 입력 → 스크래핑
2. 저장된 매핑 자동 적용
3. FieldMappingModal 열리지 않음
```

### 3. CSV 일괄 등록 (매핑 저장됨)
```
1. BulkImportModal → CSV 업로드
2. MappingConfirmationModal 자동 열림
   - 저장된 매핑 시각적 확인
   - 필드 불일치 경고 (컬렉션 필드 변경 시)
3. "매핑 사용" / "사용 안 함" 선택
4. 일괄 스크래핑 시작
```

---

## 자동 매칭 로직

### 1단계: 정확히 일치 (Exact Match)
```javascript
if (scrapedField.key === collectionField.key) {
  mapping[scrapedField.key] = collectionField.key
}
```

### 2단계: 유사한 이름 (Similar Match)
```javascript
const similar = [
  'title', '제목', 'name', '이름',
  'author', '저자', '저자명',
  'publisher', '출판사', '출판사명'
]
```

### 3단계: 수동 선택
- 드롭다운에서 선택
- "매핑 안 함" 옵션

---

## API 엔드포인트

### 매핑 저장
```bash
POST /api/scraper/save-mapping
Authorization: Bearer {JWT}

{
  "collection_id": 1,
  "mapping": {
    "title": "책제목",
    "author": "저자명"
  },
  "ignore_unmapped": true
}
```

### 매핑 조회
```bash
GET /api/scraper/get-mapping/{collection_id}
```

### 매핑 삭제
```bash
DELETE /api/scraper/mapping/{collection_id}
```

---

## apply_field_mapping() 함수

```python
def apply_field_mapping(
    scraped_data: dict,
    mapping: dict,
    ignore_unmapped: bool = True
) -> dict:
    """스크래핑 데이터에 매핑 적용"""

    if ignore_unmapped:
        # 매핑된 필드만 저장 (추천)
        result = {}
        for scraped_key, collection_key in mapping.items():
            if scraped_key in scraped_data:
                result[collection_key] = scraped_data[scraped_key]
        return result
    else:
        # 모든 필드 저장
        result = {}
        for key, value in scraped_data.items():
            # 매핑되어 있으면 변환, 없으면 원래 키 사용
            result[mapping.get(key, key)] = value
        return result
```

---

## 필드 불일치 감지

### 상황
- 매핑 저장: `{\"title\": \"책제목\", \"author\": \"저자명\"}`
- 컬렉션 필드 변경: `저자명` 필드 삭제
- CSV 업로드 시 → **경고 표시**

### MappingConfirmationModal
```
⚠️ 필드 불일치 경고

매핑된 필드 중 일부가 컬렉션에 존재하지 않습니다:
- "저자명" (삭제됨)

계속 진행하시겠습니까?
- "매핑 사용" → 존재하는 필드만 매핑
- "사용 안 함" → 매핑 무시
- "매핑 삭제" → 저장된 매핑 삭제
```

---

## 사용 예시

### 교보문고 스크래핑 데이터
```json
{
  "title": "클린 코드",
  "author": "로버트 C. 마틴",
  "publisher": "인사이트",
  "isbn": "9788966260959",
  "description": "...",
  "extra_field": "..."
}
```

### 매핑 설정
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

### 매핑 적용 후 (ignore_unmapped=true)
```json
{
  "책제목": "클린 코드",
  "저자명": "로버트 C. 마틴",
  "출판사명": "인사이트"
}
```

### 매핑 적용 후 (ignore_unmapped=false)
```json
{
  "책제목": "클린 코드",
  "저자명": "로버트 C. 마틴",
  "출판사명": "인사이트",
  "isbn": "9788966260959",
  "description": "...",
  "extra_field": "..."
}
```

---

## 관련 문서

- [웹 스크래핑 시스템](./web-scraping.md)
- [스크래핑 필드 가이드](../guides/scraper-fields.md)
- [Changelog](../changelog/)
