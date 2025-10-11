"""컬렉션 API 라우터"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.app.db import get_db
from backend.app.schemas import CollectionCreate, CollectionUpdate, CollectionResponse
from backend.app.core.auth import require_owner, is_owner
from backend.app.services.collection import (
    get_all_collections,
    get_collection_by_id,
    create_collection,
    update_collection,
    delete_collection,
)

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("/", response_model=List[CollectionResponse])
async def get_collections_endpoint(
    db: Session = Depends(get_db),
    user_is_owner: bool = Depends(is_owner)
):
    """모든 컬렉션 조회 (Owner만 비공개 포함 조회 가능)"""
    return await get_all_collections(db, is_owner=user_is_owner)


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection_endpoint(collection_id: int, db: Session = Depends(get_db)):
    """특정 컬렉션 조회"""
    return await get_collection_by_id(collection_id, db)


@router.post("/", response_model=CollectionResponse, status_code=201)
async def create_collection_endpoint(
    collection: CollectionCreate,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)
):
    """새 컬렉션 생성 (Owner only)"""
    return await create_collection(collection, db)


@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection_endpoint(
    collection_id: int,
    collection: CollectionUpdate,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)
):
    """컬렉션 수정 (Owner only)"""
    return await update_collection(collection_id, collection, db)


@router.delete("/{collection_id}", status_code=204)
async def delete_collection_endpoint(
    collection_id: int,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)
):
    """컬렉션 삭제 (Owner only)"""
    await delete_collection(collection_id, db)
    return None
