from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import re

from backend.app.db import get_db
from backend.app.db.mongodb import get_database
from backend.app.models import Collection
from backend.app.schemas import CollectionCreate, CollectionUpdate, CollectionResponse
from backend.app.core.auth import require_owner

router = APIRouter(prefix="/collections", tags=["collections"])


def generate_mongo_collection_name(slug: str) -> str:
    """slug에서 MongoDB 컬렉션명 생성 (안전)"""
    # slug를 snake_case로 변환 (하이픈 → 언더스코어)
    safe_name = slug.replace("-", "_")

    # 알파벳, 숫자, 언더스코어만 허용
    if not re.match(r'^[a-z0-9_]+$', safe_name):
        raise ValueError("Invalid slug format. Use only lowercase letters, numbers, and hyphens.")

    return f"items_{safe_name}"


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
async def create_collection(
    collection: CollectionCreate,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)
):
    """새 컬렉션 생성 (Owner only)"""
    # 중복 체크
    existing = db.query(Collection).filter(Collection.name == collection.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 컬렉션입니다")

    # MongoDB 컬렉션명 자동 생성
    try:
        mongo_collection_name = generate_mongo_collection_name(collection.slug)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # PostgreSQL에 저장
    db_collection = Collection(
        **collection.model_dump(),
        mongo_collection=mongo_collection_name
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)

    # MongoDB 컬렉션 생성 및 인덱스 설정
    mongo_db = get_database()
    await mongo_db.create_collection(mongo_collection_name)
    await mongo_db[mongo_collection_name].create_index("title")  # 제목 인덱스
    await mongo_db[mongo_collection_name].create_index("created_at")  # 생성일 인덱스

    return db_collection


@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: int,
    collection: CollectionUpdate,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)
):
    """컬렉션 수정 (Owner only)"""
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
async def delete_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)
):
    """컬렉션 삭제 (Owner only)"""
    db_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not db_collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    # MongoDB 컬렉션도 함께 삭제
    if db_collection.mongo_collection:
        mongo_db = get_database()
        await mongo_db.drop_collection(db_collection.mongo_collection)

    db.delete(db_collection)
    db.commit()
    return None
