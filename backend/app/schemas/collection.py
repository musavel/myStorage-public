from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any


class CollectionBase(BaseModel):
    """컬렉션 기본 스키마"""
    name: str
    slug: str
    icon: Optional[str] = None
    description: Optional[str] = None


class CollectionCreate(CollectionBase):
    """컬렉션 생성 스키마 (mongo_collection은 자동 생성)"""
    field_definitions: Optional[Dict[str, Any]] = None


class CollectionUpdate(BaseModel):
    """컬렉션 수정 스키마"""
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    field_definitions: Optional[Dict[str, Any]] = None


class CollectionResponse(CollectionBase):
    """컬렉션 응답 스키마"""
    id: int
    mongo_collection: Optional[str] = None  # MongoDB 컬렉션명
    field_definitions: Optional[Dict[str, Any]] = None  # 필드 정의
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
