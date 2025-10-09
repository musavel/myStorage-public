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

### 일괄 스크래핑
```bash
POST /api/scraper/bulk-scrape
Authorization: Bearer {JWT}

{
  "urls": ["url1", "url2", ...],
  "collection_id": 1,
  "apply_mapping": true
}
```

### CSV 일괄 등록
```bash
POST /api/scraper/bulk-scrape-csv
Authorization: Bearer {JWT}
Content-Type: multipart/form-data

file: CSV 파일
collection_id: 1
apply_mapping: true
```

---

## CSV 형식

```csv
URL
https://product.kyobobook.co.kr/detail/S000001713046
https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=12345
...
```

**요구사항**:
- UTF-8 인코딩
- 헤더: `URL`, `link`, `주소` 중 하나
- 각 행에 URL 하나씩

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
→ /api/scraper/bulk-scrape-csv → 실시간 진행 상황 표시
→ 완료 후 자동 닫기
```

---

## 에러 처리

### 크롤링 실패
- 페이지 로드 실패: 타임아웃 또는 404
- 파싱 실패: CSS 셀렉터 변경
- → 각 URL별 에러 메시지 반환

### CSV 형식 오류
- 인코딩 오류: UTF-8이 아님
- 헤더 없음: URL, link, 주소 중 하나 필요
- → 상세 에러 메시지 반환

---

## 제한사항

- **지원 사이트**: 교보문고, 알라딘만 특화 파싱
- **일반 사이트**: Open Graph, Twitter Card, JSON-LD 메타데이터만
- **속도**: Playwright 사용으로 느림 (평균 2~3초/URL)
- **안정성**: 사이트 구조 변경 시 파서 업데이트 필요

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
