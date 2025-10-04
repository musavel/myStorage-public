from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.db import get_db
from backend.app.models import BoardGame
from backend.app.schemas import BoardGameCreate, BoardGameUpdate, BoardGameResponse

router = APIRouter(prefix="/board-games", tags=["board-games"])


@router.get("/", response_model=List[BoardGameResponse])
async def get_board_games(db: Session = Depends(get_db)):
    """모든 보드게임 조회"""
    board_games = db.query(BoardGame).all()
    return board_games


@router.get("/{game_id}", response_model=BoardGameResponse)
async def get_board_game(game_id: int, db: Session = Depends(get_db)):
    """특정 보드게임 조회"""
    game = db.query(BoardGame).filter(BoardGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="보드게임을 찾을 수 없습니다")
    return game


@router.post("/", response_model=BoardGameResponse, status_code=201)
async def create_board_game(game: BoardGameCreate, db: Session = Depends(get_db)):
    """새 보드게임 등록"""
    from backend.app.models import Collection

    # 컬렉션 존재 확인
    collection = db.query(Collection).filter(Collection.id == game.collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    db_game = BoardGame(**game.model_dump())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


@router.put("/{game_id}", response_model=BoardGameResponse)
async def update_board_game(
    game_id: int, game: BoardGameUpdate, db: Session = Depends(get_db)
):
    """보드게임 정보 수정"""
    from backend.app.models import Collection

    db_game = db.query(BoardGame).filter(BoardGame.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="보드게임을 찾을 수 없습니다")

    update_data = game.model_dump(exclude_unset=True)

    # 컬렉션 변경 시 존재 확인
    if "collection_id" in update_data:
        collection = db.query(Collection).filter(Collection.id == update_data["collection_id"]).first()
        if not collection:
            raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    for key, value in update_data.items():
        setattr(db_game, key, value)

    db.commit()
    db.refresh(db_game)
    return db_game


@router.delete("/{game_id}", status_code=204)
async def delete_board_game(game_id: int, db: Session = Depends(get_db)):
    """보드게임 삭제"""
    db_game = db.query(BoardGame).filter(BoardGame.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="보드게임을 찾을 수 없습니다")

    db.delete(db_game)
    db.commit()
    return None
