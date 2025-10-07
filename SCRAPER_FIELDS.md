# 웹 스크래핑 필드 문서

## 개요
Playwright + BeautifulSoup를 사용한 웹 스크래핑 시스템입니다.
JavaScript 렌더링이 필요한 페이지도 처리 가능합니다.

## 지원 사이트

### 1. 교보문고 (kyobobook.co.kr)

**예시 URL:** `https://product.kyobobook.co.kr/detail/S000001713046`

#### 추출 가능한 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `title` | string | 도서 제목 | "원피스 1: 동터오는 모험 시대" |
| `author` | string | 저자명 | "Eiichiro Oda" |
| `publisher` | string | 출판사 | "대원씨아이" |
| `publication_date` | string | 출판일 | "2025.09.04" |
| `description` | string | 도서 설명 | "유쾌한 해적들의 신나는 모험 이야기..." |
| `image` | string (URL) | 표지 이미지 URL | "https://contents.kyobobook.co.kr/..." |
| `isbn` | string | ISBN (13자리 우선, 10자리 fallback) | "9791136287489" |
| `price` | integer | 판매 가격 (원) | 4950 |
| `source_url` | string (URL) | 원본 페이지 URL | (자동 추가) |
| `type` | string | Open Graph type | "website" |

#### 구현 세부사항
- CSS 셀렉터: `.prod_title`, `.author a`, `.publisher a`, `.date`, `.sell_price .val`
- ISBN: 정규식 `ISBN[:\s]*(\d{13})` 사용 (13자리 우선)
- 가격: 숫자만 추출 후 정수 변환
- 설명: `.intro_bottom` 요소에서 추출

---

### 2. 알라딘 (aladin.co.kr)

**예시 URL:** `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=281358410`

#### 추출 가능한 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `title` | string | 도서 제목 | "원피스 1" |
| `author` | string | 저자명 (복수 저자는 쉼표로 구분) | "오다 에이치로" |
| `publisher` | string | 출판사 | "대원씨아이(만화)" |
| `publication_date` | string | 출판일 (YYYY-MM-DD) | "2008-03-18" |
| `description` | string | 도서 설명 | "해적왕의 꿈을 키우는 루피는..." |
| `image` | string (URL) | 표지 이미지 URL | "https://image.aladin.co.kr/..." |
| `isbn` | string | ISBN (13자리 우선, 10자리 fallback) | "9791136287489" |
| `price` | integer | 판매 가격 (원, 할인가 기준) | 4950 |
| `source_url` | string (URL) | 원본 페이지 URL | (자동 추가) |
| `type` | string | Open Graph type | "books.book" |
| `date_published` | string | JSON-LD에서 추출 (있는 경우) | null |

#### 구현 세부사항
- CSS 셀렉터: `.prod_title`, `.Ere_prod_author_box a`, `.Ere_sub_black a`, `.Ere_prod_price .val`
- 복수 저자: 여러 `<a>` 태그에서 추출 후 쉼표로 연결
- 출판일: 정규식 `(\d{4}-\d{2}-\d{2})` 사용
- ISBN: 페이지 전체에서 정규식 검색
- 설명: 여러 셀렉터 시도 (`#divContentTab1`, `.Ere_prod_mconts_T`, `.book_summary_wrap`)

---

## 공통 추출 메커니즘

### Open Graph 메타 태그
모든 사이트에서 기본적으로 시도:
- `og:title` → `title`
- `og:description` → `description`
- `og:image` → `image`
- `og:type` → `type`

### Twitter Card 메타 태그
Open Graph가 없을 경우 fallback:
- `twitter:title` → `title`
- `twitter:description` → `description`
- `twitter:image` → `image`

### JSON-LD 구조화된 데이터
`<script type="application/ld+json">` 파싱:
- `@type: "Book"`: 도서 정보 추출
- `@type: "Product"`: 상품 정보 추출
- 필드: `name`, `author`, `publisher`, `isbn`, `datePublished`, `offers.price`

---

## 사이트별 비교

| 특징 | 교보문고 | 알라딘 |
|------|----------|--------|
| **제목 정확도** | 높음 (부제목 포함) | 보통 (간략) |
| **저자 표기** | 영문/한글 혼용 | 한글/원문 병기 |
| **출판일 형식** | `YYYY.MM.DD` | `YYYY-MM-DD` |
| **가격 정보** | 판매가 | 할인가 |
| **설명 길이** | 중간 | 중간 |
| **ISBN 추출** | CSS 셀렉터 영역 | 페이지 전체 검색 |
| **이미지 품질** | 고화질 (458px+) | 고화질 (500px) |

---

## 필드 매핑 권장 사항

도서 컬렉션을 위한 필드 정의 예시:

```json
{
  "fields": [
    {"key": "title", "label": "제목", "type": "text", "required": true},
    {"key": "author", "label": "저자", "type": "text", "required": true},
    {"key": "publisher", "label": "출판사", "type": "text", "required": false},
    {"key": "publication_date", "label": "출판일", "type": "date", "required": false},
    {"key": "isbn", "label": "ISBN", "type": "text", "required": false},
    {"key": "price", "label": "가격", "type": "number", "required": false},
    {"key": "description", "label": "설명", "type": "textarea", "required": false},
    {"key": "image", "label": "표지 이미지", "type": "text", "required": false}
  ]
}
```

### 스크래핑 필드 → 사용자 필드 매핑

| 스크래핑 필드 | 권장 매핑 |
|---------------|-----------|
| `title` | 제목 |
| `author` | 저자 |
| `publisher` | 출판사 |
| `publication_date` | 출판일 |
| `isbn` | ISBN |
| `price` | 가격 |
| `description` | 설명 |
| `image` | 표지이미지 |
| `source_url` | 구매링크 |

---

## 향후 확장 가능 사이트

### Yes24
- URL 패턴: `https://www.yes24.com/Product/Goods/{id}`
- 예상 필드: title, author, publisher, publication_date, isbn, price, description

### 인터파크 도서
- URL 패턴: `https://book.interpark.com/product/BookDisplay.do?_method=detail&sc.prdNo={id}`
- 예상 필드: title, author, publisher, publication_date, isbn, price, description

### 반디앤루니스
- URL 패턵: `https://www.bandinlunis.com/front/product/detailProduct.do?prodId={id}`
- 예상 필드: title, author, publisher, publication_date, isbn, price, description

---

## 기술 구현

### 아키텍처
```
WebScraper (Context Manager)
  ├─ Playwright (Headless Chromium)
  ├─ BeautifulSoup (HTML Parsing)
  ├─ Generic Extraction (_extract_metadata)
  │   ├─ Open Graph
  │   ├─ Twitter Card
  │   └─ JSON-LD
  └─ Site-Specific Parsers
      ├─ _parse_kyobo()
      └─ _parse_aladin()
```

### 사용 예시

#### 단일 URL 스크래핑
```python
from backend.app.services.scraper.web_scraper import scrape_url

result = await scrape_url("https://product.kyobobook.co.kr/detail/S000001713046")
print(result['title'])  # "원피스 1: 동터오는 모험 시대"
```

#### 배치 스크래핑
```python
from backend.app.services.scraper.web_scraper import scrape_urls

urls = [
    "https://product.kyobobook.co.kr/detail/S000001713046",
    "https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=281358410"
]
results = await scrape_urls(urls)
```

#### Context Manager 패턴
```python
async with WebScraper() as scraper:
    result1 = await scraper.scrape_url(url1)
    result2 = await scraper.scrape_url(url2)
    # 브라우저 재사용으로 성능 향상
```

---

## API 엔드포인트

### 단일 URL 스크래핑
```
POST /api/scraper/scrape-url
{
  "url": "https://product.kyobobook.co.kr/detail/S000001713046",
  "collection_id": 1,
  "apply_mapping": true
}
```

### 일괄 스크래핑 (CSV)
```
POST /api/scraper/bulk-scrape-csv
Content-Type: multipart/form-data

file: [CSV with URL column]
collection_id: 1
```

### 필드 매핑 저장
```
POST /api/scraper/save-mapping
{
  "collection_id": 1,
  "mapping": {
    "title": "책제목",
    "author": "저자명",
    "publisher": "출판사"
  },
  "ignore_unmapped": true
}
```

---

## 주의사항

1. **Rate Limiting**: 사이트별 요청 제한을 고려하여 적절한 딜레이 필요
2. **Robots.txt**: 각 사이트의 크롤링 정책 준수
3. **저작권**: 추출된 데이터는 개인 용도로만 사용
4. **에러 처리**: 사이트 구조 변경 시 파서 업데이트 필요
5. **성능**: 대량 스크래핑 시 Context Manager 패턴 사용 권장

---

## 버전 정보
- Playwright: 1.49.0+
- BeautifulSoup4: 4.12.0+
- Python: 3.13+

마지막 업데이트: 2025-10-06
