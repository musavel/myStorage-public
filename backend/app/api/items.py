"""아이템 API 라우터"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List

from backend.app.schemas.item import ItemCreate, ItemUpdate, ItemResponse, PaginatedItemsResponse
from backend.app.db import get_db
from backend.app.core.auth import require_owner, is_owner
from backend.app.services.item import (
    get_all_items,
    get_item_by_id,
    create_item,
    update_item,
    delete_item,
)

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=PaginatedItemsResponse)
async def get_items_endpoint(
    collection_id: int,
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    page_size: int = Query(30, ge=1, le=100, description="페이지당 아이템 수 (최대 100)"),
    search_query: str = Query(None, description="검색어"),
    search_field: str = Query(None, description="검색 필드 (all 또는 특정 필드 key)"),
    sort_key: str = Query("created_at", description="정렬 필드"),
    sort_order: str = Query("desc", description="정렬 순서 (asc 또는 desc)"),
    db: Session = Depends(get_db),
    user_is_owner: bool = Depends(is_owner)
):
    """아이템 목록 조회 (페이지네이션, 검색, 정렬, Owner만 비공개 포함 조회 가능)"""
    return await get_all_items(
        collection_id,
        db,
        is_owner=user_is_owner,
        page=page,
        page_size=page_size,
        search_query=search_query,
        search_field=search_field,
        sort_key=sort_key,
        sort_order=sort_order
    )


@router.get("/{collection_id}/{item_id}", response_model=ItemResponse)
async def get_item_endpoint(
    collection_id: int,
    item_id: str,
    db: Session = Depends(get_db),
    user_is_owner: bool = Depends(is_owner)
):
    """아이템 상세 조회 (Owner만 비공개 포함 조회 가능)"""
    return await get_item_by_id(collection_id, item_id, db, is_owner=user_is_owner)


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
