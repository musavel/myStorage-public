"""AI 설정 관리 (공통)"""
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# 전역 변수로 현재 AI 설정 저장 (DB 대신 메모리 사용)
_current_ai_settings: Dict[str, Optional[Dict[str, Any]]] = {
    "text_model": None,
    "vision_model": None
}


def get_current_settings() -> Dict[str, Optional[Dict[str, Any]]]:
    """현재 AI 설정 반환"""
    return _current_ai_settings


def update_settings(
    text_model: Optional[Dict[str, str]] = None,
    vision_model: Optional[Dict[str, str]] = None
) -> None:
    """AI 설정 업데이트

    Args:
        text_model: {"provider": "openai", "model_id": "gpt-4o-mini"}
        vision_model: {"provider": "gemini", "model_id": "gemini-2.5-flash"}
    """
    global _current_ai_settings

    if text_model:
        _current_ai_settings["text_model"] = text_model
        logger.info(f"📝 텍스트 모델 설정: {text_model['provider']}/{text_model['model_id']}")

    if vision_model:
        _current_ai_settings["vision_model"] = vision_model
        logger.info(f"👁️ 비전 모델 설정: {vision_model['provider']}/{vision_model['model_id']}")


def get_text_model() -> Optional[Dict[str, str]]:
    """현재 설정된 텍스트 모델 반환"""
    return _current_ai_settings.get("text_model")


def get_vision_model() -> Optional[Dict[str, str]]:
    """현재 설정된 비전 모델 반환"""
    return _current_ai_settings.get("vision_model")
