from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BookBase(BaseModel):
    """도서 기본 스키마"""
    title: str
    collection_id: int
    author: Optional[str] = None
    publisher: Optional[str] = None
    isbn: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    published_date: Optional[str] = None
    page_count: Optional[int] = None
    category: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_price: Optional[int] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class BookCreate(BookBase):
    """도서 생성 스키마"""
    pass


class BookUpdate(BaseModel):
    """도서 수정 스키마"""
    title: Optional[str] = None
    collection_id: Optional[int] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    isbn: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    published_date: Optional[str] = None
    page_count: Optional[int] = None
    category: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_price: Optional[int] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class BookResponse(BookBase):
    """도서 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
