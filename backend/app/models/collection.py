from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db import Base


class Collection(Base):
    """컬렉션 모델 (도서, 보드게임 등)"""
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)  # 컬렉션 이름 (예: "도서", "보드게임")
    slug = Column(String, unique=True, nullable=False, index=True)  # URL용 슬러그 (예: "books", "board-games")
    mongo_collection = Column(String, unique=True, nullable=True)  # MongoDB 컬렉션명 (예: "items_books")
    icon = Column(String, nullable=True)  # 아이콘 이름 또는 이모지
    description = Column(String, nullable=True)  # 컬렉션 설명
    field_definitions = Column(JSONB, nullable=True)  # 메타데이터 필드 정의
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 관계 설정 (레거시)
    books = relationship("Book", back_populates="collection", cascade="all, delete-orphan")
    board_games = relationship("BoardGame", back_populates="collection", cascade="all, delete-orphan")
