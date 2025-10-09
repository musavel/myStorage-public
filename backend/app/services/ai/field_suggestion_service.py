"""AI 필드 추천 서비스"""
import json
import logging
from typing import Optional, Literal
from fastapi import HTTPException
from sqlalchemy.orm import Session

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from backend.app.core.config import settings
from backend.app.schemas import FieldSuggestion
from .settings import get_text_model

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """당신은 컬렉션 관리 시스템의 메타데이터 필드 설계 전문가입니다.

사용자가 컬렉션 이름을 제공하면, 해당 컬렉션에 적합한 메타데이터 필드를 추천해주세요.

**중요 규칙:**
1. key는 영문 소문자와 언더스코어만 사용 (snake_case)
2. label은 한국어로 사용자에게 보여질 이름
3. type은 다음 중 하나: text, textarea, number, date, select
4. select 타입일 경우 options 배열 필수
5. placeholder는 입력 예시를 제공
6. 일반적으로 5-15개 필드 추천
7. 기본 필드: description(설명), image_url(이미지), purchase_date(구매일), purchase_price(구매가격), location(보관위치), notes(메모) 포함
8. **중요: "title" 필드는 절대 추천하지 마세요. title은 시스템에서 자동으로 관리되는 필수 필드입니다.**

**필드 타입 가이드:**
- text: 짧은 텍스트 (저자, ISBN, 출판사 등)
- textarea: 긴 텍스트 (설명, 메모 등)
- number: 숫자 (가격, 페이지 수, 인원 등)
- date: 날짜 (구매일, 출판일 등)
- select: 선택 옵션 (카테고리, 장르, 상태 등)

반드시 다음 JSON 형식으로만 응답하세요:
{
  "fields": [
    {
      "key": "artist",
      "label": "아티스트",
      "type": "text",
      "required": false,
      "placeholder": "예: The Beatles"
    }
  ]
}
"""


def create_llm(provider: str, model_id: str = None):
    """LLM 인스턴스 생성"""
    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise HTTPException(status_code=400, detail="OpenAI API key not configured")

        # 모델 ID가 지정되지 않으면 기본값 사용
        if not model_id:
            model_id = "gpt-4o-mini"

        return ChatOpenAI(
            model=model_id,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.7,
        )
    elif provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise HTTPException(status_code=400, detail="Gemini API key not configured")

        # 모델 ID가 지정되지 않으면 기본값 사용
        if not model_id:
            model_id = "gemini-2.5-flash"

        return ChatGoogleGenerativeAI(
            model=model_id,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported provider")


async def suggest_fields(
    db: Session,
    collection_name: str,
    description: Optional[str] = None,
    provider: Optional[Literal["openai", "gemini"]] = None,
    model_id: Optional[str] = None
) -> tuple[list[FieldSuggestion], str]:
    """AI 기반 컬렉션 필드 추천

    Returns:
        tuple[list[FieldSuggestion], str]: (필드 목록, provider)
    """
    try:
        # provider와 model_id 결정
        if not provider:
            text_model = get_text_model(db)
            if text_model:
                provider = text_model["provider"]
                model_id = text_model["model_id"]
                logger.info(f"📝 설정된 모델 사용: {provider}/{model_id}")
            else:
                # 모델 설정이 없으면 에러 발생
                raise HTTPException(
                    status_code=400,
                    detail="AI 모델이 설정되지 않았습니다. 관리자 페이지에서 AI 모델을 먼저 설정해주세요."
                )

        # LLM 생성
        llm = create_llm(provider, model_id)

        # 사용자 메시지 구성
        user_message = f"컬렉션 이름: {collection_name}"
        if description:
            user_message += f"\n설명: {description}"

        # LangChain 메시지 생성
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_message)
        ]

        # LLM 호출
        response = await llm.ainvoke(messages)

        # JSON 파싱
        try:
            # 코드 블록 제거
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            result = json.loads(content)

            if "fields" not in result:
                raise ValueError("Invalid response format: missing 'fields' key")

            fields = [FieldSuggestion(**field) for field in result["fields"]]
            return fields, provider

        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse AI response: {str(e)}\nResponse: {response.content[:200]}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process AI response: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI request failed: {str(e)}"
        )


