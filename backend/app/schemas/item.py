from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ItemBase(BaseModel):
    """Item 기본 스키마"""
    collection_id: int
    title: Optional[str] = None  # 메타데이터에서 자동 추출 가능
    metadata: Dict[str, Any] = Field(default_factory=dict)  # 동적 메타데이터


class ItemCreate(ItemBase):
    """Item 생성 스키마"""
    pass


class ItemUpdate(BaseModel):
    """Item 수정 스키마"""
    title: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ItemResponse(ItemBase):
    """Item 응답 스키마"""
    id: str = Field(alias="_id")  # MongoDB _id
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True  # _id와 id 모두 허용
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class FieldSchema(BaseModel):
    """메타데이터 필드 스키마 정의"""
    key: str  # 필드 키 (예: "author", "isbn")
    label: str  # 표시 라벨 (예: "저자", "ISBN")
    type: str  # 필드 타입 (text, number, date, textarea, select)
    required: bool = False
    options: Optional[list[str]] = None  # select 타입일 때 선택 옵션
    placeholder: Optional[str] = None
    help_text: Optional[str] = None


class CollectionSchema(BaseModel):
    """컬렉션 스키마 (PostgreSQL Collection.schema 필드용)"""
    fields: list[FieldSchema] = Field(default_factory=list)
