"""AI 필드 추천 스키마"""
from pydantic import BaseModel
from typing import Optional, List, Literal


class FieldSuggestion(BaseModel):
    """AI가 추천한 필드"""
    key: str
    label: str
    type: Literal["text", "textarea", "number", "date", "select"]
    required: bool = False
    placeholder: Optional[str] = None
    options: Optional[List[str]] = None
    help_text: Optional[str] = None
