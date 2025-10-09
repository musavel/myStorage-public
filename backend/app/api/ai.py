"""AI API 라우터"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Literal

from backend.app.core.auth import require_owner
from backend.app.schemas import FieldSuggestion
from backend.app.services.ai import (
    suggest_fields,
    translate_slug,
    get_current_settings,
    update_settings,
    get_available_models,
    get_available_providers,
)

router = APIRouter(prefix="/ai", tags=["ai"])


# ===== Request/Response Models =====

class FieldSuggestionResponse(BaseModel):
    """필드 추천 응답"""
    fields: List[FieldSuggestion]
    provider: str


class SuggestFieldsRequest(BaseModel):
    """필드 추천 요청"""
    collection_name: str
    description: Optional[str] = None
    provider: Optional[Literal["openai", "gemini"]] = None
    model_id: Optional[str] = None


class TranslateSlugRequest(BaseModel):
    """슬러그 번역 요청"""
    text: str


class ModelSelection(BaseModel):
    provider: str
    modelId: str


class AISettingsRequest(BaseModel):
    textModel: Optional[ModelSelection] = None
    visionModel: Optional[ModelSelection] = None


# ===== 필드 추천 API =====

@router.post("/suggest-fields", response_model=FieldSuggestionResponse)
async def suggest_fields_endpoint(
    request: SuggestFieldsRequest,
    email: str = Depends(require_owner)
):
    """AI 기반 컬렉션 필드 추천 (Owner only)"""
    fields, provider = await suggest_fields(
        collection_name=request.collection_name,
        description=request.description,
        provider=request.provider,
        model_id=request.model_id
    )
    return FieldSuggestionResponse(fields=fields, provider=provider)


@router.post("/translate-slug")
async def translate_slug_endpoint(
    request: TranslateSlugRequest,
    email: str = Depends(require_owner)
):
    """텍스트를 영문 slug로 번역 (Owner only)"""
    slug = await translate_slug(request.text)
    return {"slug": slug}


# ===== AI 모델 관리 API =====

@router.get("/models")
async def get_models_endpoint():
    """사용 가능한 AI 모델 목록 반환"""
    models = await get_available_models()
    return {
        "success": True,
        "models": models
    }


@router.get("/providers")
async def get_providers_endpoint():
    """사용 가능한 AI 제공자 목록"""
    providers = await get_available_providers()
    return {"providers": providers}


@router.post("/set-models")
async def set_models_endpoint(
    settings_req: AISettingsRequest,
    email: str = Depends(require_owner)
):
    """AI 모델 설정 저장 (Owner only)"""
    text_model = None
    vision_model = None

    if settings_req.textModel:
        text_model = {
            "provider": settings_req.textModel.provider,
            "model_id": settings_req.textModel.modelId
        }

    if settings_req.visionModel:
        vision_model = {
            "provider": settings_req.visionModel.provider,
            "model_id": settings_req.visionModel.modelId
        }

    update_settings(text_model=text_model, vision_model=vision_model)

    return {
        "success": True,
        "message": "AI 모델 설정이 저장되었습니다.",
        "settings": get_current_settings()
    }


@router.get("/get-models")
async def get_current_models_endpoint():
    """현재 설정된 AI 모델 정보 반환"""
    return {
        "success": True,
        "settings": get_current_settings()
    }
