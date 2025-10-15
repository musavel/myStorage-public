# AI 필드 추천 기능 설정 가이드

## 개요
LangChain & LangGraph 1.0 alpha를 사용한 AI 기반 컬렉션 필드 자동 추천 기능

## 지원 AI 제공자
- ✅ **OpenAI** (GPT-4o Mini, GPT-4o, GPT-4.1, GPT-5 시리즈)
- ✅ **Google Gemini** (2.5 Flash, Pro, Flash Lite)

---

## 1. API 키 발급

### OpenAI API 키
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 키 이름 입력 (예: myStorage)
4. 키 복사 (sk-proj-...)

**비용:** GPT-4o Mini 사용 시 1000회 약 $0.15 (매우 저렴)

### Google Gemini API 키
1. https://aistudio.google.com/apikey 접속
2. "Get API key" 클릭
3. 프로젝트 선택 또는 생성
4. 키 복사

**비용:** Gemini 2.5 Flash는 무료 티어 제공 (RPM 제한 있음)

---

## 2. .env 파일 설정

`.env` 파일에 다음 추가:

```bash
# AI API Keys
OPENAI_API_KEY=sk-proj-your-key-here
GEMINI_API_KEY=your-gemini-key-here
```

**최소 하나의 API 키만 설정하면 작동합니다!**

---

## 3. 사용 방법

### API 엔드포인트

#### 필드 추천 요청
```bash
POST /api/ai/suggest-fields
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "collection_name": "LP 레코드",
  "description": "바닐 레코드 컬렉션",  // 선택
  "provider": "openai"  // "openai" 또는 "gemini"
}
```

#### 응답 예시
```json
{
  "fields": [
    {
      "key": "artist",
      "label": "아티스트",
      "type": "text",
      "required": false,
      "placeholder": "예: The Beatles"
    },
    {
      "key": "album",
      "label": "앨범",
      "type": "text",
      "required": false,
      "placeholder": "예: Abbey Road"
    },
    {
      "key": "genre",
      "label": "장르",
      "type": "select",
      "required": false,
      "options": ["록", "팝", "재즈", "클래식", "힙합"]
    },
    {
      "key": "rpm",
      "label": "RPM",
      "type": "select",
      "required": false,
      "options": ["33", "45", "78"]
    },
    {
      "key": "label",
      "label": "레이블",
      "type": "text",
      "required": false,
      "placeholder": "예: Apple Records"
    },
    {
      "key": "release_year",
      "label": "발매년도",
      "type": "number",
      "required": false,
      "placeholder": "예: 1969"
    },
    {
      "key": "condition",
      "label": "상태",
      "type": "select",
      "required": false,
      "options": ["Mint", "Near Mint", "Very Good", "Good", "Fair", "Poor"]
    },
    {
      "key": "purchase_date",
      "label": "구매일",
      "type": "date",
      "required": false
    },
    {
      "key": "purchase_price",
      "label": "구매가격",
      "type": "number",
      "required": false,
      "placeholder": "원 단위"
    },
    {
      "key": "location",
      "label": "보관위치",
      "type": "text",
      "required": false,
      "placeholder": "예: 거실 선반 3번"
    },
    {
      "key": "notes",
      "label": "메모",
      "type": "textarea",
      "required": false
    }
  ],
  "provider": "openai"
}
```

#### 사용 가능한 제공자 확인
```bash
GET /api/ai/providers
```

응답:
```json
{
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "available": true
    },
    {
      "id": "gemini",
      "name": "Google Gemini",
      "available": false,
      "reason": "API key not configured"
    }
  ]
}
```

---

## 4. AI 모델 설정 (관리자 페이지)

### 설정 방법
1. `/admin` 페이지 접속
2. "🤖 AI 모델 설정" 카드 클릭
3. 텍스트 모델 및 비전 모델 선택
4. "저장" 버튼 클릭

### 설정 저장 위치
- **PostgreSQL `user_settings` 테이블**: 영구 저장
- **여러 브라우저/기기에서 동일한 설정 사용**
- localStorage에 저장하지 않음 (DB가 단일 소스)

### API 엔드포인트

#### 현재 설정 조회
```bash
GET /api/ai/get-models
```

응답:
```json
{
  "success": true,
  "settings": {
    "text_model": {
      "provider": "openai",
      "model_id": "gpt-4o-mini"
    },
    "vision_model": {
      "provider": "gemini",
      "model_id": "gemini-2.5-flash"
    }
  }
}
```

#### 설정 저장
```bash
POST /api/ai/set-models
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "textModel": {
    "provider": "openai",
    "modelId": "gpt-4o-mini"
  },
  "visionModel": {
    "provider": "gemini",
    "modelId": "gemini-2.5-flash"
  }
}
```

---

## 5. 프론트엔드 통합

```typescript
// AI 필드 추천 호출
const suggestFields = async (collectionName: string, provider: string) => {
  const response = await fetch('/api/ai/suggest-fields', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      collection_name: collectionName,
      provider: provider
    })
  });

  const data = await response.json();
  return data.fields;
};
```

---

## 5. 기술 스택

### LangChain & LangGraph 1.0 Alpha
- **LangGraph**: 에이전트 오케스트레이션 프레임워크
- **LangChain**: LLM 통합 라이브러리
- **버전**: 1.0.0a4 (2025년 9월 29일 릴리스)

### 특징
- ✅ Production-ready (Uber, LinkedIn, Klarna 사용)
- ✅ Low-level 제어 가능
- ✅ 내구성 있는 실행 (durable execution)
- ✅ Human-in-the-loop 패턴 지원

### 패키지
```toml
langchain>=0.3.0
langchain-openai>=0.2.14
langchain-google-genai>=2.0.5
langgraph>=1.0.0a4
```

---

## 6. 트러블슈팅

### API 키 오류
```
HTTPException: OpenAI API key not configured
```
→ `.env` 파일에 `OPENAI_API_KEY` 설정 확인

### JSON 파싱 오류
```
Failed to parse AI response
```
→ AI 응답이 잘못된 형식일 경우 발생. 다시 시도하거나 다른 provider 사용

### 비용 관리
- OpenAI: https://platform.openai.com/usage
- Gemini: 무료 티어 사용 (제한: 분당 15 요청)

---

## 7. 개선 아이디어

### 단기
- [ ] 스트리밍 응답 (실시간 필드 생성)
- [ ] 필드 수 조절 옵션
- [ ] 언어 선택 (영어/한국어)

### 중기
- [ ] Few-shot learning ([collection-examples.md](./collection-examples.md) 활용)
- [ ] 사용자 피드백 반영 (좋아요/싫어요)
- [ ] 필드 설명(help_text) 자동 생성

### 장기
- [ ] RAG 기반 유사 컬렉션 검색
- [ ] 커스텀 프롬프트 지원
- [ ] 멀티 모달 (이미지 기반 추천)

---

## 관련 문서
- [컬렉션 예시](./collection-examples.md) - 다양한 컬렉션 타입별 필드 정의 예시
- [개발 진행 상황](../DEVELOPMENT.md) - AI 기능 개발 히스토리
