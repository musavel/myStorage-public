from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db import Base


class Book(Base):
    """도서 모델"""
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)

    # 기본 정보
    title = Column(String, nullable=False, index=True)  # 제목
    author = Column(String, nullable=True)  # 저자
    publisher = Column(String, nullable=True)  # 출판사
    isbn = Column(String, unique=True, nullable=True, index=True)  # ISBN

    # 상세 정보
    description = Column(Text, nullable=True)  # 설명
    image_url = Column(String, nullable=True)  # 표지 이미지 URL
    published_date = Column(String, nullable=True)  # 출판일
    page_count = Column(Integer, nullable=True)  # 페이지 수
    category = Column(String, nullable=True)  # 장르/분류

    # 소장 정보
    purchase_date = Column(String, nullable=True)  # 구매일
    purchase_price = Column(Integer, nullable=True)  # 구매 가격
    location = Column(String, nullable=True)  # 보관 위치
    notes = Column(Text, nullable=True)  # 메모

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 관계 설정
    collection = relationship("Collection", back_populates="books")
