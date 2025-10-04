from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BoardGameBase(BaseModel):
    """보드게임 기본 스키마"""
    title: str
    collection_id: int
    designer: Optional[str] = None
    publisher: Optional[str] = None
    year_published: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    min_playtime: Optional[int] = None
    max_playtime: Optional[int] = None
    min_age: Optional[int] = None
    complexity: Optional[str] = None
    category: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_price: Optional[int] = None
    location: Optional[str] = None
    expansion: Optional[str] = None
    notes: Optional[str] = None


class BoardGameCreate(BoardGameBase):
    """보드게임 생성 스키마"""
    pass


class BoardGameUpdate(BaseModel):
    """보드게임 수정 스키마"""
    title: Optional[str] = None
    collection_id: Optional[int] = None
    designer: Optional[str] = None
    publisher: Optional[str] = None
    year_published: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    min_playtime: Optional[int] = None
    max_playtime: Optional[int] = None
    min_age: Optional[int] = None
    complexity: Optional[str] = None
    category: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_price: Optional[int] = None
    location: Optional[str] = None
    expansion: Optional[str] = None
    notes: Optional[str] = None


class BoardGameResponse(BoardGameBase):
    """보드게임 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
