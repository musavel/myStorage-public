# AI 모델 시스템

AI 기반 필드 추천 및 번역 기능

---

## 개요

LangChain & LangGraph 1.0 alpha를 사용한 AI 통합 시스템

- **필드 추천**: 컬렉션 이름 기반 메타데이터 자동 생성
- **Slug 번역**: 한글/다국어 → 영문 slug 자동 변환
- **모델 관리**: DB 기반 설정 저장 및 관리

---

## 지원 AI 모델

### OpenAI
- GPT-4o Mini (추천, 저렴)
- GPT-4o
- GPT-4.1
- GPT-5 시리즈

### Google Gemini
- Gemini 2.5 Flash (추천, 무료 티어)
- Gemini 2.5 Pro
- Gemini 2.5 Flash Lite

---

## 설정 저장 시스템

### 이전 방식 (localStorage)
- 브라우저마다 별도 설정 필요
- localStorage 삭제 시 설정 손실
- 다른 기기에서 다시 설정

### 현재 방식 (PostgreSQL DB)
- UserSettings 테이블에 영구 저장
- 여러 브라우저/기기에서 동일한 설정
- 설정 손실 방지
- 서버 재시작 후에도 유지

### 저장 형식
```python
# DB: "provider/model_id"
ai_text_model = "openai/gpt-4o-mini"
ai_vision_model = "gemini/gemini-2.5-flash"

# API: {"provider": "...", "model_id": "..."}
{
  "textModel": {
    "provider": "openai",
    "model_id": "gpt-4o-mini"
  }
}
```

---

## AI 필드 추천

### 시스템 프롬프트
```
당신은 컬렉션 관리 시스템의 메타데이터 필드 설계 전문가입니다.

중요 규칙:
1. key는 영문 소문자와 언더스코어만 사용 (snake_case)
2. label은 한국어로 사용자에게 보여질 이름
3. type: text, textarea, number, date, select
4. select 타입일 경우 options 배열 필수
5. 일반적으로 5-15개 필드 추천
6. **title 필드는 절대 추천하지 마세요** (시스템 필수 필드)
```

### 사용 예시
```
입력: 컬렉션 이름 = "LP 레코드"
출력: [
  {key: "artist", label: "아티스트", type: "text"},
  {key: "album", label: "앨범", type: "text"},
  {key: "genre", label: "장르", type: "select", options: ["록", "팝", ...]},
  {key: "rpm", label: "RPM", type: "select", options: ["33", "45", "78"]},
  ...
]
```

---

## DeepL 번역 시스템

### 기능
- 한글/다국어 컬렉션 이름 → 영문 slug 자동 생성
- AI 모델 설정 불필요
- 무료 플랜: 월 500,000 문자

### 사용 예시
```
입력: "도서"
출력: "books"

입력: "LP 레코드"
출력: "lp-records"
```

### Fallback
- 번역 실패 시 MD5 해시 사용
- 예: `collection-a3f4b2c1`

---

## API 엔드포인트

### 필드 추천
```bash
POST /api/ai/suggest-fields
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "collection_name": "도서",
  "description": "개인 소장 도서",  # 선택
  "provider": "openai",  # 선택 (없으면 설정된 모델 사용)
  "model_id": "gpt-4o-mini"  # 선택
}
```

### Slug 번역
```bash
POST /api/ai/translate-slug
Authorization: Bearer {JWT}

{"text": "도서"}
```

### 설정 저장
```bash
POST /api/ai/set-models
Authorization: Bearer {JWT}

{
  "textModel": {"provider": "openai", "modelId": "gpt-4o-mini"},
  "visionModel": {"provider": "gemini", "modelId": "gemini-2.5-flash"}
}
```

### 설정 조회
```bash
GET /api/ai/get-models
```

---

## 비용

### OpenAI GPT-4o Mini
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens
- 1000회 필드 추천: 약 $0.15

### Google Gemini 2.5 Flash
- 무료 티어: RPM 제한 있음
- 프로덕션: 유료 플랜 필요

### DeepL
- 무료 플랜: 월 500,000 문자
- Pro 플랜: 월 $5.49~

---

## 관련 문서

- [AI 설정 가이드](../guides/ai-setup.md)
- [Changelog](../changelog/)
