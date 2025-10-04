from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CollectionBase(BaseModel):
    """컬렉션 기본 스키마"""
    name: str
    slug: str
    icon: Optional[str] = None
    description: Optional[str] = None


class CollectionCreate(CollectionBase):
    """컬렉션 생성 스키마"""
    pass


class CollectionUpdate(BaseModel):
    """컬렉션 수정 스키마"""
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None


class CollectionResponse(CollectionBase):
    """컬렉션 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
