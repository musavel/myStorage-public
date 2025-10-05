"""컬렉션 관리 서비스"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from typing import List
import re
import hashlib

from backend.app.models import Collection
from backend.app.schemas import CollectionCreate, CollectionUpdate
from backend.app.db.mongodb import get_database


def generate_mongo_collection_name(slug: str) -> str:
    """slug에서 MongoDB 컬렉션명 생성 (한글 지원)"""
    # 영문/숫자만 있으면 그대로 사용
    safe_name = slug.replace("-", "_").lower()

    if re.match(r'^[a-z0-9_]+$', safe_name):
        return f"items_{safe_name}"

    # 한글이나 특수문자가 있으면 hash 사용
    slug_hash = hashlib.md5(slug.encode('utf-8')).hexdigest()[:12]
    return f"items_{slug_hash}"


async def get_all_collections(db: Session) -> List[Collection]:
    """모든 컬렉션 조회"""
    collections = db.execute(select(Collection)).scalars().all()
    return list(collections)


async def get_collection_by_id(collection_id: int, db: Session) -> Collection:
    """ID로 컬렉션 조회"""
    collection = db.execute(
        select(Collection).filter(Collection.id == collection_id)
    ).scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    return collection


async def create_collection(collection_data: CollectionCreate, db: Session) -> Collection:
    """새 컬렉션 생성"""
    # 중복 체크
    existing = db.execute(
        select(Collection).filter(Collection.name == collection_data.name)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 컬렉션입니다")

    # Slug 자동 생성 (없으면 AI로 번역)
    final_slug = collection_data.slug
    if not final_slug:
        from backend.app.services.ai import translate_slug
        final_slug = await translate_slug(collection_data.name)

    # MongoDB 컬렉션명 자동 생성
    try:
        mongo_collection_name = generate_mongo_collection_name(final_slug)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # PostgreSQL에 저장
    collection_dict = collection_data.model_dump()
    collection_dict['slug'] = final_slug  # AI로 생성된 slug 사용

    db_collection = Collection(
        **collection_dict,
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


async def update_collection(
    collection_id: int,
    collection_data: CollectionUpdate,
    db: Session
) -> Collection:
    """컬렉션 수정"""
    db_collection = db.execute(
        select(Collection).filter(Collection.id == collection_id)
    ).scalar_one_or_none()

    if not db_collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    # 업데이트할 데이터만 적용
    update_data = collection_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_collection, key, value)

    db.commit()
    db.refresh(db_collection)
    return db_collection


async def delete_collection(collection_id: int, db: Session) -> None:
    """컬렉션 삭제"""
    db_collection = db.execute(
        select(Collection).filter(Collection.id == collection_id)
    ).scalar_one_or_none()

    if not db_collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    # MongoDB 컬렉션도 함께 삭제
    if db_collection.mongo_collection:
        mongo_db = get_database()
        await mongo_db.drop_collection(db_collection.mongo_collection)

    db.delete(db_collection)
    db.commit()
