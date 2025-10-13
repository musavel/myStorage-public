"""아이템 관리 서비스"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from typing import Dict, Any, Optional
from bson import ObjectId
from datetime import datetime, timezone

from backend.app.models import Collection
from backend.app.schemas.item import ItemCreate, ItemUpdate
from backend.app.db.mongodb import get_database


def item_helper(item: dict) -> dict:
    """MongoDB 문서를 Pydantic 모델로 변환"""
    item["_id"] = str(item["_id"])
    return item


async def get_mongo_collection_name(collection_id: int, db: Session) -> str:
    """PostgreSQL에서 검증된 MongoDB 컬렉션명 조회 (SQL Injection 방지)"""
    collection = db.execute(
        select(Collection).filter(Collection.id == collection_id)
    ).scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if not collection.mongo_collection:
        raise HTTPException(status_code=500, detail="MongoDB collection not configured")

    return collection.mongo_collection


async def get_all_items(
    collection_id: int,
    db: Session,
    is_owner: bool = False,
    page: int = 1,
    page_size: int = 30,
    search_query: Optional[str] = None,
    search_field: Optional[str] = None,
    sort_key: str = "created_at",
    sort_order: str = "desc"
) -> Dict[str, Any]:
    """아이템 목록 조회 (페이지네이션, 검색, 정렬)"""
    mongo_collection_name = await get_mongo_collection_name(collection_id, db)

    mongo_db = get_database()
    query = {} if is_owner else {"is_public": True}

    # 검색 조건 추가
    if search_query and search_field:
        if search_field == "all":
            # 전체 검색: metadata의 모든 값에서 검색 (정규식 사용)
            query["$or"] = [
                {f"metadata.{key}": {"$regex": search_query, "$options": "i"}}
                for key in ["title", "author", "publisher", "category"]  # 주요 필드만
            ]
        else:
            # 특정 필드 검색
            query[f"metadata.{search_field}"] = {"$regex": search_query, "$options": "i"}

    # 전체 개수 조회
    total = await mongo_db[mongo_collection_name].count_documents(query)

    # 정렬 설정
    sort_direction = -1 if sort_order == "desc" else 1
    if sort_key == "created_at":
        sort_by = [("created_at", sort_direction)]
    else:
        # 메타데이터 필드로 정렬
        sort_by = [(f"metadata.{sort_key}", sort_direction)]

    # 페이지네이션 계산
    skip = (page - 1) * page_size
    total_pages = (total + page_size - 1) // page_size  # 올림 계산

    # 아이템 조회
    items = await mongo_db[mongo_collection_name].find(query).sort(sort_by).skip(skip).limit(page_size).to_list(page_size)

    return {
        "items": [item_helper(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


async def get_item_by_id(
    collection_id: int,
    item_id: str,
    db: Session,
    is_owner: bool = False
) -> Dict[str, Any]:
    """아이템 상세 조회"""
    mongo_collection_name = await get_mongo_collection_name(collection_id, db)

    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")

    mongo_db = get_database()
    query = {"_id": ObjectId(item_id)}
    if not is_owner:
        query["is_public"] = True
    item = await mongo_db[mongo_collection_name].find_one(query)

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item_helper(item)


async def create_item(item_data: ItemCreate, db: Session) -> Dict[str, Any]:
    """아이템 생성"""
    mongo_collection_name = await get_mongo_collection_name(item_data.collection_id, db)

    mongo_db = get_database()
    item_dict = item_data.model_dump()

    # title이 없으면 metadata에서 첫 번째 값을 사용 (또는 기본값)
    if not item_dict.get("title"):
        metadata = item_dict.get("metadata", {})
        # 일반적인 title 필드들 시도
        for title_key in ["title", "name", "제목", "이름"]:
            if title_key in metadata:
                item_dict["title"] = metadata[title_key]
                break
        # 그래도 없으면 첫 번째 값 사용
        if not item_dict.get("title") and metadata:
            first_value = list(metadata.values())[0]
            item_dict["title"] = str(first_value) if first_value else "Untitled"
        elif not item_dict.get("title"):
            item_dict["title"] = "Untitled"

    item_dict["created_at"] = datetime.now(timezone.utc)
    item_dict["updated_at"] = None

    result = await mongo_db[mongo_collection_name].insert_one(item_dict)
    created_item = await mongo_db[mongo_collection_name].find_one({"_id": result.inserted_id})

    return item_helper(created_item)


async def update_item(
    collection_id: int,
    item_id: str,
    item_data: ItemUpdate,
    db: Session
) -> Dict[str, Any]:
    """아이템 수정"""
    mongo_collection_name = await get_mongo_collection_name(collection_id, db)

    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")

    mongo_db = get_database()

    # 존재 확인
    existing = await mongo_db[mongo_collection_name].find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")

    # 업데이트할 필드만 추출
    update_data = {k: v for k, v in item_data.model_dump(exclude_unset=True).items()}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await mongo_db[mongo_collection_name].update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_data}
        )

    updated_item = await mongo_db[mongo_collection_name].find_one({"_id": ObjectId(item_id)})
    return item_helper(updated_item)


async def delete_item(collection_id: int, item_id: str, db: Session) -> None:
    """아이템 삭제"""
    mongo_collection_name = await get_mongo_collection_name(collection_id, db)

    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")

    mongo_db = get_database()
    result = await mongo_db[mongo_collection_name].delete_one({"_id": ObjectId(item_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
