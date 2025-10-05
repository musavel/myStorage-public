"""아이템 관리 서비스"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from typing import List, Dict, Any
from bson import ObjectId
from datetime import datetime

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


async def get_all_items(collection_id: int, db: Session) -> List[Dict[str, Any]]:
    """아이템 목록 조회"""
    mongo_collection_name = await get_mongo_collection_name(collection_id, db)

    mongo_db = get_database()
    items = await mongo_db[mongo_collection_name].find().to_list(1000)
    return [item_helper(item) for item in items]


async def get_item_by_id(
    collection_id: int,
    item_id: str,
    db: Session
) -> Dict[str, Any]:
    """아이템 상세 조회"""
    mongo_collection_name = await get_mongo_collection_name(collection_id, db)

    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")

    mongo_db = get_database()
    item = await mongo_db[mongo_collection_name].find_one({"_id": ObjectId(item_id)})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item_helper(item)


async def create_item(item_data: ItemCreate, db: Session) -> Dict[str, Any]:
    """아이템 생성"""
    mongo_collection_name = await get_mongo_collection_name(item_data.collection_id, db)

    mongo_db = get_database()
    item_dict = item_data.model_dump()
    item_dict["created_at"] = datetime.utcnow()
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
        update_data["updated_at"] = datetime.utcnow()
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
