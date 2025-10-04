from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.db import get_db
from backend.app.models import Collection
from backend.app.schemas import CollectionCreate, CollectionUpdate, CollectionResponse

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("/", response_model=List[CollectionResponse])
async def get_collections(db: Session = Depends(get_db)):
    """모든 컬렉션 조회"""
    collections = db.query(Collection).all()
    return collections


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(collection_id: int, db: Session = Depends(get_db)):
    """특정 컬렉션 조회"""
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")
    return collection


@router.post("/", response_model=CollectionResponse, status_code=201)
async def create_collection(collection: CollectionCreate, db: Session = Depends(get_db)):
    """새 컬렉션 생성"""
    # 중복 체크
    existing = db.query(Collection).filter(Collection.name == collection.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 컬렉션입니다")

    db_collection = Collection(**collection.model_dump())
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection


@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: int, collection: CollectionUpdate, db: Session = Depends(get_db)
):
    """컬렉션 수정"""
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    # 업데이트할 데이터만 적용
    update_data = collection.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_collection, key, value)

    db.commit()
    db.refresh(db_collection)
    return db_collection


@router.delete("/{collection_id}", status_code=204)
async def delete_collection(collection_id: int, db: Session = Depends(get_db)):
    """컬렉션 삭제"""
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    db.delete(db_collection)
    db.commit()
    return None
