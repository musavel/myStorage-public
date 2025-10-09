from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from backend.app.db import Base


class UserSettings(Base):
    """사용자(소유자) 설정 모델"""
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, unique=True, nullable=False, index=True)  # 소유자 이메일
    ai_text_model = Column(String, nullable=True)  # AI 텍스트 모델 ID (예: "gpt-4o-mini")
    ai_vision_model = Column(String, nullable=True)  # AI 비전 모델 ID (예: "gpt-4o")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
