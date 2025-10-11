"""스크래핑 및 아이템 생성 서비스"""
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.app.models.collection import Collection
from backend.app.schemas.item import ItemCreate
from backend.app.services.item.item_service import create_item as create_item_service
from backend.app.services.scraper.web_scraper import scrape_url, apply_field_mapping


async def scrape_url_with_mapping(
    url: str,
    collection_id: int,
    apply_mapping: bool,
    db: Session
) -> Dict[str, Any]:
    """
    URL 스크래핑 후 매핑 적용

    Args:
        url: 스크래핑할 URL
        collection_id: 컬렉션 ID
        apply_mapping: 매핑 적용 여부
        db: DB 세션

    Returns:
        스크래핑 및 매핑된 메타데이터
    """
    # URL 스크래핑
    metadata = await scrape_url(url)

    # 매핑 적용
    if apply_mapping:
        stmt = select(Collection).where(Collection.id == collection_id)
        result = db.execute(stmt)
        collection = result.scalar_one_or_none()

        if collection and collection.field_mapping:
            mapping_config = collection.field_mapping
            if isinstance(mapping_config, dict):
                mapping = mapping_config.get("mapping", {})
                ignore_unmapped = mapping_config.get("ignore_unmapped", False)
                metadata = apply_field_mapping(metadata, mapping, ignore_unmapped)
            else:
                # 레거시 형식
                metadata = apply_field_mapping(metadata, mapping_config)

    return metadata


async def scrape_and_create(
    url: str,
    collection_id: int,
    db: Session
) -> Dict[str, Any]:
    """
    URL 스크래핑 후 아이템 생성

    Args:
        url: 스크래핑할 URL
        collection_id: 컬렉션 ID
        db: DB 세션

    Returns:
        생성된 아이템 정보
    """
    # URL 스크래핑
    metadata = await scrape_url(url)

    # 아이템 생성
    item_data = ItemCreate(
        collection_id=collection_id,
        metadata=metadata
    )
    item = await create_item_service(item_data, db)

    return {
        "success": True,
        "item": {
            "id": str(item["_id"]),
            "metadata": item["metadata"],
        },
    }


