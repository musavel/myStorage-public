from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db import Base


class BoardGame(Base):
    """보드게임 모델"""
    __tablename__ = "board_games"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)

    # 기본 정보
    title = Column(String, nullable=False, index=True)  # 제목
    designer = Column(String, nullable=True)  # 디자이너
    publisher = Column(String, nullable=True)  # 출판사
    year_published = Column(Integer, nullable=True)  # 출시년도

    # 게임 정보
    description = Column(Text, nullable=True)  # 설명
    image_url = Column(String, nullable=True)  # 박스 이미지 URL
    min_players = Column(Integer, nullable=True)  # 최소 인원
    max_players = Column(Integer, nullable=True)  # 최대 인원
    min_playtime = Column(Integer, nullable=True)  # 최소 플레이 시간(분)
    max_playtime = Column(Integer, nullable=True)  # 최대 플레이 시간(분)
    min_age = Column(Integer, nullable=True)  # 권장 연령
    complexity = Column(String, nullable=True)  # 난이도 (쉬움/보통/어려움)
    category = Column(String, nullable=True)  # 장르/분류

    # 소장 정보
    purchase_date = Column(String, nullable=True)  # 구매일
    purchase_price = Column(Integer, nullable=True)  # 구매 가격
    location = Column(String, nullable=True)  # 보관 위치
    expansion = Column(String, nullable=True)  # 확장팩 정보
    notes = Column(Text, nullable=True)  # 메모

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 관계 설정
    collection = relationship("Collection", back_populates="board_games")
