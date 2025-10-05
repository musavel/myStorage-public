"""아이템 API 라우터"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from backend.app.db import get_db
from backend.app.core.auth import require_owner
from backend.app.services.item import (
    get_all_items,
    get_item_by_id,
    create_item,
    update_item,
    delete_item,
)

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=List[ItemResponse])
async def get_items_endpoint(
    collection_id: int,
    db: Session = Depends(get_db)
):
    """아이템 목록 조회 (Public)"""
    return await get_all_items(collection_id, db)


@router.get("/{collection_id}/{item_id}", response_model=ItemResponse)
async def get_item_endpoint(
    collection_id: int,
    item_id: str,
    db: Session = Depends(get_db)
):
    """아이템 상세 조회 (Public)"""
    return await get_item_by_id(collection_id, item_id, db)


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item_endpoint(
    item: ItemCreate,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)
):
    """아이템 생성 (Owner only)"""
    return await create_item(item, db)


@router.put("/{collection_id}/{item_id}", response_model=ItemResponse)
async def update_item_endpoint(
    collection_id: int,
    item_id: str,
    item: ItemUpdate,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)
):
    """아이템 수정 (Owner only)"""
    return await update_item(collection_id, item_id, item, db)


@router.delete("/{collection_id}/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item_endpoint(
    collection_id: int,
    item_id: str,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner)
):
    """아이템 삭제 (Owner only)"""
    await delete_item(collection_id, item_id, db)
    return None
