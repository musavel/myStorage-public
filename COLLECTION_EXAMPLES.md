# 컬렉션 필드 정의 예시

이 파일은 관리자가 새로운 컬렉션을 만들 때 참고할 수 있는 `field_definitions` 예시입니다.

## 사용 방법

1. 관리자 페이지에서 컬렉션 생성
2. 아래 예시 중 하나를 복사하여 `field_definitions`에 붙여넣기
3. 필요에 따라 필드 추가/수정/삭제

---

## 📚 도서 (Books)

### 컬렉션 정보
- **name**: 도서
- **slug**: books
- **icon**: 📚

### field_definitions
```json
{
  "fields": [
    {
      "key": "author",
      "label": "저자",
      "type": "text",
      "required": false,
      "placeholder": "예: 로버트 C. 마틴"
    },
    {
      "key": "publisher",
      "label": "출판사",
      "type": "text",
      "required": false,
      "placeholder": "예: 인사이트"
    },
    {
      "key": "isbn",
      "label": "ISBN",
      "type": "text",
      "required": false,
      "placeholder": "예: 9788966260959"
    },
    {
      "key": "description",
      "label": "설명",
      "type": "textarea",
      "required": false,
      "placeholder": "책 내용 요약"
    },
    {
      "key": "image_url",
      "label": "표지 이미지 URL",
      "type": "text",
      "required": false,
      "placeholder": "https://..."
    },
    {
      "key": "published_date",
      "label": "출판일",
      "type": "date",
      "required": false
    },
    {
      "key": "page_count",
      "label": "페이지 수",
      "type": "number",
      "required": false,
      "placeholder": "예: 464"
    },
    {
      "key": "category",
      "label": "카테고리",
      "type": "select",
      "required": false,
      "options": ["소설", "기술서", "에세이", "자기계발", "역사", "과학", "기타"]
    },
    {
      "key": "purchase_date",
      "label": "구매일",
      "type": "date",
      "required": false
    },
    {
      "key": "purchase_price",
      "label": "구매 가격",
      "type": "number",
      "required": false,
      "placeholder": "원 단위"
    },
    {
      "key": "location",
      "label": "보관 위치",
      "type": "text",
      "required": false,
      "placeholder": "예: 서재 2번 책장"
    },
    {
      "key": "notes",
      "label": "메모",
      "type": "textarea",
      "required": false,
      "placeholder": "추가 메모사항"
    }
  ]
}
```

---

## 🎲 보드게임 (Board Games)

### 컬렉션 정보
- **name**: 보드게임
- **slug**: board-games
- **icon**: 🎲

### field_definitions
```json
{
  "fields": [
    {
      "key": "designer",
      "label": "디자이너",
      "type": "text",
      "required": false,
      "placeholder": "예: 클라우스 토이버"
    },
    {
      "key": "publisher",
      "label": "출판사",
      "type": "text",
      "required": false,
      "placeholder": "예: 코리아보드게임즈"
    },
    {
      "key": "year_published",
      "label": "출시년도",
      "type": "number",
      "required": false,
      "placeholder": "예: 2020"
    },
    {
      "key": "description",
      "label": "설명",
      "type": "textarea",
      "required": false,
      "placeholder": "게임 설명"
    },
    {
      "key": "image_url",
      "label": "박스 이미지 URL",
      "type": "text",
      "required": false,
      "placeholder": "https://..."
    },
    {
      "key": "min_players",
      "label": "최소 인원",
      "type": "number",
      "required": false,
      "placeholder": "예: 2"
    },
    {
      "key": "max_players",
      "label": "최대 인원",
      "type": "number",
      "required": false,
      "placeholder": "예: 4"
    },
    {
      "key": "min_playtime",
      "label": "최소 플레이시간(분)",
      "type": "number",
      "required": false,
      "placeholder": "예: 30"
    },
    {
      "key": "max_playtime",
      "label": "최대 플레이시간(분)",
      "type": "number",
      "required": false,
      "placeholder": "예: 60"
    },
    {
      "key": "min_age",
      "label": "권장 연령",
      "type": "number",
      "required": false,
      "placeholder": "예: 10"
    },
    {
      "key": "complexity",
      "label": "난이도",
      "type": "select",
      "required": false,
      "options": ["쉬움", "보통", "어려움", "전문가"]
    },
    {
      "key": "category",
      "label": "카테고리",
      "type": "select",
      "required": false,
      "options": ["전략", "파티", "협동", "덱빌딩", "추리", "블러핑", "기타"]
    },
    {
      "key": "purchase_date",
      "label": "구매일",
      "type": "date",
      "required": false
    },
    {
      "key": "purchase_price",
      "label": "구매 가격",
      "type": "number",
      "required": false,
      "placeholder": "원 단위"
    },
    {
      "key": "location",
      "label": "보관 위치",
      "type": "text",
      "required": false,
      "placeholder": "예: 거실 선반"
    },
    {
      "key": "expansion",
      "label": "확장팩",
      "type": "text",
      "required": false,
      "placeholder": "소유한 확장팩 목록"
    },
    {
      "key": "notes",
      "label": "메모",
      "type": "textarea",
      "required": false,
      "placeholder": "추가 메모사항"
    }
  ]
}
```

---

## 🎬 영화 (Movies) - 추가 예시

### 컬렉션 정보
- **name**: 영화
- **slug**: movies
- **icon**: 🎬

### field_definitions
```json
{
  "fields": [
    {
      "key": "director",
      "label": "감독",
      "type": "text",
      "required": false,
      "placeholder": "예: 크리스토퍼 놀란"
    },
    {
      "key": "actors",
      "label": "주연 배우",
      "type": "text",
      "required": false,
      "placeholder": "쉼표로 구분"
    },
    {
      "key": "runtime",
      "label": "러닝타임(분)",
      "type": "number",
      "required": false,
      "placeholder": "예: 148"
    },
    {
      "key": "genre",
      "label": "장르",
      "type": "select",
      "required": false,
      "options": ["액션", "드라마", "코미디", "SF", "스릴러", "호러", "로맨스", "다큐멘터리"]
    },
    {
      "key": "rating",
      "label": "관람등급",
      "type": "select",
      "required": false,
      "options": ["전체", "12세", "15세", "청불"]
    },
    {
      "key": "format",
      "label": "포맷",
      "type": "select",
      "required": false,
      "options": ["DVD", "Blu-ray", "4K UHD", "디지털"]
    },
    {
      "key": "description",
      "label": "줄거리",
      "type": "textarea",
      "required": false
    },
    {
      "key": "purchase_date",
      "label": "구매일",
      "type": "date",
      "required": false
    },
    {
      "key": "purchase_price",
      "label": "구매 가격",
      "type": "number",
      "required": false
    },
    {
      "key": "notes",
      "label": "메모",
      "type": "textarea",
      "required": false
    }
  ]
}
```

---

## 필드 타입 설명

| Type | 설명 | 사용 예시 |
|------|------|-----------|
| `text` | 단일 텍스트 입력 | 이름, 제목, ISBN |
| `textarea` | 여러 줄 텍스트 | 설명, 메모 |
| `number` | 숫자 입력 | 가격, 페이지 수, 인원 |
| `date` | 날짜 선택 | 구매일, 출판일 |
| `select` | 드롭다운 선택 | 카테고리, 난이도 |

## 필드 속성 설명

- `key`: 데이터베이스에 저장될 키 (영문, snake_case)
- `label`: 사용자에게 보여질 라벨 (한글 가능)
- `type`: 입력 필드 타입
- `required`: 필수 여부 (true/false)
- `placeholder`: 입력 예시 텍스트
- `options`: select 타입일 때 선택 옵션 배열
- `help_text`: 도움말 텍스트 (선택)
