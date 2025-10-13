# 웹 스크래핑 시스템

Playwright 기반 JavaScript 렌더링 페이지 크롤링

---

## 개요

- **Playwright**: Headless 브라우저로 JavaScript 렌더링 페이지 처리
- **BeautifulSoup**: HTML 파싱
- **사이트별 특화 파싱**: 교보문고, 알라딘

---

## 지원 사이트

### 교보문고 (kyobobook.co.kr)
**크롤링 가능 필드**:
- title (제목)
- author (저자)
- publisher (출판사)
- published_date (출판일)
- price (가격)
- isbn (ISBN)
- description (설명)
- category (카테고리)
- page_count (쪽수)
- image_url (표지 이미지)

### 알라딘 (aladin.co.kr)
**크롤링 가능 필드**:
- title (제목)
- author (저자, 복수 지원)
- publisher (출판사)
- published_date (출판일)
- price (가격)
- isbn (ISBN)
- description (설명)
- page_count (쪽수)
- image_url (표지 이미지)

---

## 기술 구조

### WebScraper 서비스
```python
class WebScraper:
    async def __aenter__(self):
        """Context manager 시작: 브라우저 시작"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        return self

    async def scrape_url(self, url: str) -> dict:
        """URL 크롤링"""
        # 1. 도메인 감지
        # 2. 사이트별 파서 선택
        # 3. 페이지 로드
        # 4. 데이터 추출
        # 5. 정제 및 반환
```

### 사이트별 파서
```python
def _parse_kyobobook(self, soup) -> dict:
    """교보문고 전용 파서"""
    data = {}
    data['title'] = soup.select_one('.title').text.strip()
    data['author'] = soup.select_one('.author').text.strip()
    # ...
    return data

def _parse_aladin(self, soup) -> dict:
    """알라딘 전용 파서"""
    # ...
```

---

## API 엔드포인트

### 단일 URL 스크래핑
```bash
POST /api/scraper/scrape-url
Authorization: Bearer {JWT}

{
  "url": "https://product.kyobobook.co.kr/detail/S000001713046",
  "collection_id": 1,
  "apply_mapping": true  # 필드 매핑 적용 여부
}
```

### 스크래핑 후 아이템 생성
```bash
POST /api/scraper/scrape-and-create
Authorization: Bearer {JWT}

{
  "url": "...",
  "collection_id": 1
}
```

### CSV 일괄 등록 (스트리밍)
```bash
POST /api/scraper/bulk-scrape-csv-stream
Authorization: Bearer {JWT}
Content-Type: multipart/form-data

file: CSV 파일
collection_id: 1
apply_mapping: true
```

**응답**: Server-Sent Events (SSE)
- `type: 'start'` - 시작 (total 포함)
- `type: 'progress'` - 진행 중 (current, total, success, failed, progress %, item 포함)
- `type: 'error_item'` - 개별 아이템 실패 (스크래핑 실패 시 CSV 데이터로 아이템 생성, item 정보 포함)
- `type: 'blocked'` - 차단 감지 (즉시 중단, download_token과 remaining_count 포함)
- `type: 'complete'` - 완료 (total, success, failed)
- `type: 'error'` - 전체 오류

**완료 후 확인 단계**:
- 등록된 아이템 미리보기 제공
- "확인 및 닫기" 버튼으로 수동 종료

#### CSV 파일 형식
- **양식 다운로드**: 프론트엔드에서 제공
- **컬럼 순서**: `title,URL,purchase_date`
- **title** (메모용): 사용자 확인용 메모, 실제 데이터에는 미포함
- **URL** (필수): 스크래핑할 페이지 주소
- **purchase_date** (선택): 구매일 등 추가 정보 (YYYY-MM-DD 형식)
- **인코딩**: UTF-8 (BOM 포함)

**동작 방식**:
1. CSV에서 URL 추출 (대소문자 무시: url, URL, link, 주소)
2. 각 URL 스크래핑
3. CSV의 추가 컬럼 데이터를 스크래핑 결과에 병합 (title 제외)
4. 필드 매핑 적용 (선택)
5. 아이템 생성

**Fallback 메커니즘** (스크래핑 실패 시):
- 스크래핑 에러 발생 시 CSV 데이터만으로 아이템 자동 생성
- `source_url` 포함하여 메타데이터 구성
- 필드 매핑 적용 후 MongoDB에 저장
- UI에는 "실패"로 표시 (failed_count 증가)
- 생성된 아이템 정보는 `error_item` 이벤트에 포함
- 예시: "행 5: 스크래핑 실패 (네트워크 오류). CSV 데이터로 아이템 생성됨."

---

## CSV 형식 예시

```csv
title,URL,purchase_date
원피스 1권,https://product.kyobobook.co.kr/detail/S000001713046,2024-01-15
해리포터,https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=12345,2024-02-20
...
```

**요구사항**:
- UTF-8 인코딩 (BOM 포함 권장)
- 헤더: `URL`, `link`, `주소` 중 하나 필수
- `title` 컬럼: 사용자 확인용 메모 (실제 데이터에는 미포함)
- 추가 컬럼 (예: `purchase_date`): 스크래핑 데이터에 병합됨

---

## 사용 흐름

### 1. 직접 URL 입력
```
사용자 → ItemModal → URL 입력 → "정보 가져오기" 클릭
→ /api/scraper/scrape-url → 폼 자동 입력 → 수정 후 저장
```

### 2. CSV 일괄 등록
```
사용자 → BulkImportModal → CSV 업로드
→ 저장된 매핑 확인 → 사용/사용 안 함 선택
→ /api/scraper/bulk-scrape-csv-stream → 실시간 진행 상황 표시 (SSE)
→ 완료 후 결과 확인 및 수동 닫기
```

---

## 에러 처리

### 크롤링 실패

#### 일반 에러 (계속 진행)
- 페이지 로드 실패: 타임아웃, 404, 네트워크 오류 등
- 파싱 실패: CSS 셀렉터 변경
- **CSV 일괄 등록**: Fallback 메커니즘으로 CSV 데이터만 저장
  - 스크래핑 실패 시 원본 CSV 데이터로 아이템 생성
  - UI에 "실패"로 표시되지만 데이터는 저장됨
  - 메시지: "행 N: 스크래핑 실패 (에러 내용). CSV 데이터로 아이템 생성됨."
- **단건 등록**: 에러 메시지 표시 후 중단

#### 차단 감지 (즉시 중단)
- 트리거: "제목을 찾을 수 없습니다" 에러 발생 시
- **단건**: "페이지가 차단되었거나 접근할 수 없습니다" 메시지 표시
- **CSV 일괄**:
  - 즉시 중단 (나머지 URL 처리 안 함)
  - 남은 URL + 원본 CSV 데이터를 토큰 기반으로 다운로드 제공
    - SSE 페이로드 크기 제한 해결: 전체 배열 대신 토큰만 전송
    - 백엔드에서 CSV 생성 후 메모리에 임시 저장
    - 프론트엔드는 토큰으로 `/api/scraper/download-remaining-csv/{token}` 호출
  - 사용자가 나중에 재시도 가능

### CSV 형식 오류
- 인코딩 오류: UTF-8이 아님
- 헤더 없음: URL, link, 주소 중 하나 필요
- → 상세 에러 메시지 반환

### CSV 재등록 안정성
- 남은 URL CSV 다운로드 시 메타데이터 보존
- 토큰 기반 다운로드로 대용량 데이터 처리
- 원본 CSV의 모든 컬럼 및 헤더 순서 유지

---

## 제한사항

- **지원 사이트**: 교보문고, 알라딘만 특화 파싱
- **일반 사이트**: Open Graph, Twitter Card, JSON-LD 메타데이터만
- **속도**: Playwright 사용으로 느림 (평균 2~3초/URL)
- **안정성**: 사이트 구조 변경 시 파서 업데이트 필요

## 성능 및 안정성

### Timeout 설정
- **페이지 로드 timeout**: 60초
- **로드 전략**: `domcontentloaded` (빠른 로딩)
- **일괄 등록과 단건 등록 동일**: 안정성 보장

---

## 확장 방법

### 새 사이트 추가
1. `_parse_새사이트()` 함수 추가
2. `scrape_url()`에서 도메인 감지 로직 추가
3. CSS 셀렉터 매핑

### 새 필드 추가
1. `_parse_*()` 함수에서 필드 추출 로직 추가
2. SCRAPER_FIELDS.md 문서 업데이트

---

## 관련 문서

- [스크래핑 필드 가이드](../guides/scraper-fields.md)
- [필드 매핑 시스템](./field-mapping.md)
- [Changelog](../changelog/)
