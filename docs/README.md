# 📚 myStorage 문서

myStorage 개인 소장품 관리 시스템 문서 모음

---

## 🚀 빠른 시작

프로젝트를 처음 시작한다면:
- [프로젝트 README](../README.md) - 설치 및 실행 가이드

---

## 🏗️ 아키텍처

시스템 구조와 설계 결정 사항:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 전체 시스템 아키텍처
  - 하이브리드 DB 구조 (PostgreSQL + MongoDB)
  - Service Layer Pattern
  - 인증 시스템
  - 데이터 흐름
  - 보안 및 성능

---

## 📖 기능별 문서

각 기능의 상세 설명:

### 핵심 기능
- [컬렉션 시스템](./features/collections.md)
  - 동적 필드 정의
  - Title 필드 시스템
  - Slug 자동 생성

- [AI 모델 시스템](./features/ai-models.md)
  - 필드 추천 (LangChain & LangGraph)
  - DeepL 번역
  - DB 기반 설정 관리

### 데이터 수집
- [웹 스크래핑](./features/web-scraping.md)
  - Playwright 기반 크롤링
  - 사이트별 특화 파싱
  - CSV 일괄 등록

- [필드 매핑](./features/field-mapping.md)
  - 자동 매칭 로직
  - 매핑 저장 및 재사용
  - 필드 불일치 감지

---

## 📘 사용자 가이드

실무 사용 가이드:
- [AI 기능 설정](./guides/ai-setup.md) - OpenAI/Gemini API 키 발급 및 설정
- [인증 및 보안](./guides/authentication.md) - Google OAuth 2.0 설정
- [컬렉션 예시](./guides/collection-examples.md) - 도서, 보드게임, 영화 등
- [스크래핑 필드](./guides/scraper-fields.md) - 교보문고/알라딘 필드 매핑

---

## 📅 변경 이력

일별 개발 진행 상황:
- [Changelog 인덱스](./changelog/README.md)
- [2025-10-10 (목)](./changelog/2025-10-10.md) - AI 설정 DB 관리 & 문서 구조 개편
- [2025-10-09 (목)](./changelog/2025-10-09.md) - 스크래핑 개선 & 매핑 시스템 고도화
- [2025-10-08 (수)](./changelog/2025-10-08.md) - UI/UX 개선 & Title 필수화
- [2025-10-07 (화)](./changelog/2025-10-07.md) - 필드 매핑 로직 재설계
- [2025-10-06 (월)](./changelog/2025-10-06.md) - 컬렉션 UI & 웹 스크래핑
- [2025-10-05 (일)](./changelog/2025-10-05.md) - 프로젝트 초기 구현

---

## 🗂️ 문서 구조

```
docs/
├── README.md                # 📚 이 파일 (문서 인덱스)
├── ARCHITECTURE.md          # 🏗️ 시스템 아키텍처
├── changelog/               # 📅 일별 변경 이력
│   ├── README.md
│   ├── 2025-10-05.md
│   ├── 2025-10-06.md
│   ├── ...
│   └── 2025-10-10.md
├── features/                # 📖 기능별 상세 문서
│   ├── ai-models.md
│   ├── collections.md
│   ├── field-mapping.md
│   └── web-scraping.md
└── guides/                  # 📘 사용자 가이드
    ├── ai-setup.md
    ├── authentication.md
    ├── collection-examples.md
    └── scraper-fields.md
```

---

## 🔗 외부 링크

- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [Next.js 문서](https://nextjs.org/docs)
- [LangChain 문서](https://python.langchain.com/)
- [Playwright 문서](https://playwright.dev/python/)
- [MongoDB 문서](https://www.mongodb.com/docs/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

---

## 📝 문서 작성 가이드

### 새 기능 추가 시
1. `features/` 에 기능 문서 작성
2. `changelog/` 에 변경 이력 추가
3. 필요시 `guides/` 에 사용자 가이드 작성
4. 이 README.md에 링크 추가

### 일별 작업 기록 시
1. `changelog/YYYY-MM-DD.md` 파일 생성
2. `changelog/README.md`에 링크 추가
3. 이 README.md의 "변경 이력" 섹션 업데이트
