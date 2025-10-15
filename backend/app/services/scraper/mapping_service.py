"""필드 매핑 관리 서비스"""
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException

from backend.app.models.collection import Collection


async def save_field_mapping(
    collection_id: int,
    mapping: dict[str, str],
    ignore_unmapped: bool,
    db: Session
) -> dict:
    """
    컬렉션의 필드 매핑 저장

    Args:
        collection_id: 컬렉션 ID
        mapping: 필드 매핑 딕셔너리
        ignore_unmapped: 매핑되지 않은 필드 무시 여부
        db: DB 세션

    Returns:
        저장된 매핑 정보
    """
    stmt = select(Collection).where(Collection.id == collection_id)
    result = db.execute(stmt)
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다.")

    # 매핑 설정 저장
    collection.field_mapping = {
        "mapping": mapping,
        "ignore_unmapped": ignore_unmapped,
    }
    db.commit()

    return {
        "success": True,
        "mapping": mapping,
        "ignore_unmapped": ignore_unmapped,
    }


async def get_field_mapping(collection_id: int, db: Session) -> dict:
    """
    컬렉션의 저장된 필드 매핑 조회

    Args:
        collection_id: 컬렉션 ID
        db: DB 세션

    Returns:
        저장된 매핑 정보
    """
    stmt = select(Collection).where(Collection.id == collection_id)
    result = db.execute(stmt)
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다.")

    return collection.field_mapping or {}


async def delete_field_mapping(collection_id: int, db: Session) -> dict:
    """
    컬렉션의 저장된 필드 매핑 삭제

    Args:
        collection_id: 컬렉션 ID
        db: DB 세션

    Returns:
        삭제 성공 메시지
    """
    stmt = select(Collection).where(Collection.id == collection_id)
    result = db.execute(stmt)
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다.")

    collection.field_mapping = None
    db.commit()

    return {"success": True, "message": "필드 매핑이 삭제되었습니다."}
