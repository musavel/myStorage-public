from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Literal
import json
import logging

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent

from backend.app.core.config import settings
from backend.app.core.auth import require_owner
from backend.app.core.ai_model_manager import get_model_manager

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger(__name__)

# 전역 변수로 현재 설정 저장 (DB 대신 메모리 사용)
current_ai_settings = {
    "text_model": None,
    "vision_model": None
}


class FieldSuggestion(BaseModel):
    """AI가 추천한 필드"""
    key: str
    label: str
    type: Literal["text", "textarea", "number", "date", "select"]
    required: bool = False
    placeholder: Optional[str] = None
    options: Optional[List[str]] = None
    help_text: Optional[str] = None


class FieldSuggestionResponse(BaseModel):
    """필드 추천 응답"""
    fields: List[FieldSuggestion]
    provider: str  # "openai" or "gemini"


class SuggestFieldsRequest(BaseModel):
    """필드 추천 요청"""
    collection_name: str
    description: Optional[str] = None
    provider: Optional[Literal["openai", "gemini"]] = None  # None이면 설정된 모델 사용
    model_id: Optional[str] = None  # 특정 모델 지정


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

**필드 타입 가이드:**
- text: 짧은 텍스트 (이름, 제목, ISBN 등)
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

        # Gemini 모델 ID 매핑 (langchain-google-genai 형식)
        gemini_model_mapping = {
            "gemini-2.5-flash": "gemini-2.0-flash-exp",
            "gemini-2.5-flash-lite": "gemini-2.0-flash-exp",
            "gemini-2.5-pro": "gemini-2.0-flash-exp",
        }

        if not model_id:
            model_id = "gemini-2.0-flash-exp"
        elif model_id in gemini_model_mapping:
            model_id = gemini_model_mapping[model_id]

        return ChatGoogleGenerativeAI(
            model=model_id,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported provider")


@router.post("/suggest-fields", response_model=FieldSuggestionResponse)
async def suggest_fields(
    request: SuggestFieldsRequest,
    email: str = Depends(require_owner)
):
    """AI 기반 컬렉션 필드 추천 (Owner only)"""

    try:
        # provider와 model_id 결정
        provider = request.provider
        model_id = request.model_id

        # provider가 지정되지 않으면 설정된 텍스트 모델 사용
        if not provider:
            if current_ai_settings["text_model"]:
                provider = current_ai_settings["text_model"]["provider"]
                model_id = current_ai_settings["text_model"]["model_id"]
                logger.info(f"📝 설정된 모델 사용: {provider}/{model_id}")
            else:
                # 기본값: OpenAI
                provider = "openai"
                model_id = "gpt-4o-mini"
                logger.info(f"⚠️ 설정된 모델 없음. 기본 모델 사용: {provider}/{model_id}")

        # LLM 생성
        llm = create_llm(provider, model_id)

        # 사용자 메시지 구성
        user_message = f"컬렉션 이름: {request.collection_name}"
        if request.description:
            user_message += f"\n설명: {request.description}"

        # LangGraph Agent 생성 (도구 없이 간단한 대화)
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

            return FieldSuggestionResponse(
                fields=[FieldSuggestion(**field) for field in result["fields"]],
                provider=request.provider
            )
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


@router.get("/providers")
async def get_available_providers():
    """사용 가능한 AI 제공자 목록"""
    providers = []

    if settings.OPENAI_API_KEY:
        providers.append({
            "id": "openai",
            "name": "OpenAI (GPT-4o-mini)",
            "available": True
        })
    else:
        providers.append({
            "id": "openai",
            "name": "OpenAI (GPT-4o-mini)",
            "available": False,
            "reason": "API key not configured"
        })

    if settings.GEMINI_API_KEY:
        providers.append({
            "id": "gemini",
            "name": "Google Gemini 2.0 Flash",
            "available": True
        })
    else:
        providers.append({
            "id": "gemini",
            "name": "Google Gemini 2.0 Flash",
            "available": False,
            "reason": "API key not configured"
        })

    return {"providers": providers}


# ===== 모델 선택 관련 API =====

class ModelSelection(BaseModel):
    provider: str
    modelId: str


class AISettingsRequest(BaseModel):
    textModel: Optional[ModelSelection] = None
    visionModel: Optional[ModelSelection] = None


@router.get("/models")
async def get_available_models():
    """사용 가능한 AI 모델 목록 반환 (ai_models.json에서 로드)"""
    try:
        model_manager = get_model_manager()
        all_models = model_manager.get_all_models()

        # Pydantic 모델에 맞게 변환
        formatted_models = {}
        for provider, models in all_models.items():
            formatted_models[provider] = {}
            for model_id, config in models.items():
                formatted_models[provider][model_id] = {
                    "name": config.name,
                    "input_modalities": config.input_modalities,
                    "output_modalities": config.output_modalities,
                    "pricing": {
                        "input": config.pricing.input,
                        "output": config.pricing.output,
                        **({"input_audio": config.pricing.input_audio} if config.pricing.input_audio else {}),
                        **({"input_over_128k": config.pricing.input_over_128k} if config.pricing.input_over_128k else {}),
                        **({"output_over_128k": config.pricing.output_over_128k} if config.pricing.output_over_128k else {}),
                        **({"input_over_200k": config.pricing.input_over_200k} if config.pricing.input_over_200k else {}),
                        **({"output_over_200k": config.pricing.output_over_200k} if config.pricing.output_over_200k else {}),
                    }
                }

        return {
            "success": True,
            "models": formatted_models
        }

    except Exception as e:
        logger.error(f"모델 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"모델 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/set-models")
async def set_ai_models(
    settings_req: AISettingsRequest,
    email: str = Depends(require_owner)
):
    """프론트엔드에서 선택한 AI 모델 설정 저장 (Owner only)"""
    global current_ai_settings

    try:
        # 설정 저장
        if settings_req.textModel:
            current_ai_settings["text_model"] = {
                "provider": settings_req.textModel.provider,
                "model_id": settings_req.textModel.modelId
            }
            logger.info(f"📝 텍스트 모델 설정: {settings_req.textModel.provider}/{settings_req.textModel.modelId}")

        if settings_req.visionModel:
            current_ai_settings["vision_model"] = {
                "provider": settings_req.visionModel.provider,
                "model_id": settings_req.visionModel.modelId
            }
            logger.info(f"👁️ 비전 모델 설정: {settings_req.visionModel.provider}/{settings_req.visionModel.modelId}")

        logger.info(f"✅ AI 모델 설정 완료: {current_ai_settings}")

        return {
            "success": True,
            "message": "AI 모델 설정이 저장되었습니다.",
            "settings": current_ai_settings
        }

    except Exception as e:
        logger.error(f"AI 모델 설정 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI 모델 설정 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/get-models")
async def get_current_ai_models():
    """현재 설정된 AI 모델 정보 반환"""
    return {
        "success": True,
        "settings": current_ai_settings
    }
