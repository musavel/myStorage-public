"""AI 모델 관리 서비스"""
import logging
from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.core.ai_model_manager import get_model_manager

logger = logging.getLogger(__name__)


async def get_available_models():
    """사용 가능한 AI 모델 목록 반환"""
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

        return formatted_models

    except Exception as e:
        logger.error(f"모델 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"모델 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


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
            "name": "Google Gemini 2.5 Flash",
            "available": True
        })
    else:
        providers.append({
            "id": "gemini",
            "name": "Google Gemini 2.5 Flash",
            "available": False,
            "reason": "API key not configured"
        })

    return providers
