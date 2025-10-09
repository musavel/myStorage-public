"""AI 설정 관리 (DB 기반)"""
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.app.models import UserSettings
from backend.app.core.config import settings as app_settings

logger = logging.getLogger(__name__)


def get_or_create_user_settings(db: Session, user_email: str) -> UserSettings:
    """사용자 설정 가져오기 또는 생성"""
    stmt = select(UserSettings).where(UserSettings.user_email == user_email)
    result = db.execute(stmt).scalar_one_or_none()

    if not result:
        result = UserSettings(user_email=user_email)
        db.add(result)
        db.commit()
        db.refresh(result)
        logger.info(f"✨ 새 사용자 설정 생성: {user_email}")

    return result


def get_current_settings(db: Session) -> Dict[str, Optional[Dict[str, Any]]]:
    """현재 AI 설정 반환 (DB에서)"""
    user_settings = get_or_create_user_settings(db, app_settings.OWNER_EMAIL)

    text_model = None
    vision_model = None

    if user_settings.ai_text_model:
        # "provider/model_id" 형식으로 저장됨
        parts = user_settings.ai_text_model.split("/", 1)
        if len(parts) == 2:
            text_model = {"provider": parts[0], "model_id": parts[1]}

    if user_settings.ai_vision_model:
        parts = user_settings.ai_vision_model.split("/", 1)
        if len(parts) == 2:
            vision_model = {"provider": parts[0], "model_id": parts[1]}

    return {
        "text_model": text_model,
        "vision_model": vision_model
    }


def update_settings(
    db: Session,
    text_model: Optional[Dict[str, str]] = None,
    vision_model: Optional[Dict[str, str]] = None
) -> None:
    """AI 설정 업데이트 (DB에 저장)

    Args:
        db: 데이터베이스 세션
        text_model: {"provider": "openai", "model_id": "gpt-4o-mini"}
        vision_model: {"provider": "gemini", "model_id": "gemini-2.5-flash"}
    """
    user_settings = get_or_create_user_settings(db, app_settings.OWNER_EMAIL)

    if text_model:
        user_settings.ai_text_model = f"{text_model['provider']}/{text_model['model_id']}"
        logger.info(f"📝 텍스트 모델 설정: {text_model['provider']}/{text_model['model_id']}")

    if vision_model:
        user_settings.ai_vision_model = f"{vision_model['provider']}/{vision_model['model_id']}"
        logger.info(f"👁️ 비전 모델 설정: {vision_model['provider']}/{vision_model['model_id']}")

    db.commit()
    db.refresh(user_settings)


def get_text_model(db: Session) -> Optional[Dict[str, str]]:
    """현재 설정된 텍스트 모델 반환"""
    return get_current_settings(db).get("text_model")


def get_vision_model(db: Session) -> Optional[Dict[str, str]]:
    """현재 설정된 비전 모델 반환"""
    return get_current_settings(db).get("vision_model")
