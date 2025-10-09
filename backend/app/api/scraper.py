"""스크래핑 API 엔드포인트"""
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
import csv
import io
import logging
import traceback

from ..db import get_db
from ..core.auth import require_owner

logger = logging.getLogger(__name__)
from ..schemas.scraper import (
    ScrapeUrlRequest,
    ScrapeUrlResponse,
    BulkScrapeRequest,
    BulkScrapeResponse,
    FieldMappingRequest,
)
from ..services.scraper.web_scraper import scrape_url, scrape_urls, apply_field_mapping
from ..services.item.item_service import create_item as create_item_service
from ..models.collection import Collection
from sqlalchemy import select


router = APIRouter(prefix="/api/scraper", tags=["scraper"])


@router.post("/save-mapping")
async def save_field_mapping(
    request: FieldMappingRequest,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """
    컬렉션의 필드 매핑 저장
    """
    # 컬렉션 조회
    stmt = select(Collection).where(Collection.id == request.collection_id)
    result = db.execute(stmt)
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다.")

    # 매핑 설정 저장 (매핑 + ignore_unmapped 옵션)
    collection.field_mapping = {
        "mapping": request.mapping,
        "ignore_unmapped": request.ignore_unmapped,
    }
    db.commit()

    return {
        "success": True,
        "mapping": request.mapping,
        "ignore_unmapped": request.ignore_unmapped,
    }


@router.get("/get-mapping/{collection_id}")
async def get_field_mapping(
    collection_id: int,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """
    컬렉션의 저장된 필드 매핑 조회
    """
    stmt = select(Collection).where(Collection.id == collection_id)
    result = db.execute(stmt)
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다.")

    return {"mapping": collection.field_mapping or {}}


@router.delete("/delete-mapping/{collection_id}")
async def delete_field_mapping(
    collection_id: int,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """
    컬렉션의 저장된 필드 매핑 삭제
    """
    stmt = select(Collection).where(Collection.id == collection_id)
    result = db.execute(stmt)
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다.")

    collection.field_mapping = None
    db.commit()

    return {"success": True, "message": "필드 매핑이 삭제되었습니다."}


@router.post("/scrape-url", response_model=ScrapeUrlResponse)
async def scrape_single_url(
    request: ScrapeUrlRequest,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """
    단일 URL 스크래핑하여 메타데이터 추출 (매핑 적용 옵션)
    """
    try:
        logger.info(f"스크래핑 시작: {request.url}")
        metadata = await scrape_url(str(request.url))
        logger.info(f"스크래핑 완료: {len(metadata)} 필드")

        # 매핑 적용
        if request.apply_mapping:
            stmt = select(Collection).where(Collection.id == request.collection_id)
            result = db.execute(stmt)
            collection = result.scalar_one_or_none()

            if collection and collection.field_mapping:
                mapping_config = collection.field_mapping
                if isinstance(mapping_config, dict):
                    # 새 형식: {"mapping": {...}, "ignore_unmapped": bool}
                    mapping = mapping_config.get("mapping", {})
                    ignore_unmapped = mapping_config.get("ignore_unmapped", False)
                    metadata = apply_field_mapping(metadata, mapping, ignore_unmapped)
                else:
                    # 레거시 형식 (단순 dict)
                    metadata = apply_field_mapping(metadata, mapping_config)

        return ScrapeUrlResponse(
            metadata=metadata,
            source_url=str(request.url),
        )
    except Exception as e:
        logger.error(f"스크래핑 실패: {str(e)}")
        logger.error(f"상세 에러:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"스크래핑 실패: {str(e)}")


@router.post("/scrape-and-create", response_model=dict)
async def scrape_and_create_item(
    request: ScrapeUrlRequest,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """
    URL 스크래핑 후 바로 아이템 생성
    """
    try:
        logger.info(f"스크래핑 및 아이템 생성 시작: {request.url}")
        # URL 스크래핑
        metadata = await scrape_url(str(request.url))

        # 아이템 생성
        item = await create_item_service(
            db=db,
            collection_id=request.collection_id,
            metadata=metadata,
        )

        return {
            "success": True,
            "item": {
                "id": str(item["_id"]),
                "metadata": item["metadata"],
            },
        }
    except Exception as e:
        logger.error(f"아이템 생성 실패: {str(e)}")
        logger.error(f"상세 에러:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"아이템 생성 실패: {str(e)}")


@router.post("/bulk-scrape", response_model=BulkScrapeResponse)
async def bulk_scrape_urls(
    request: BulkScrapeRequest,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """
    여러 URL 일괄 스크래핑 및 아이템 생성
    """
    urls = [str(url) for url in request.urls]
    results = await scrape_urls(urls)

    # 매핑 설정 가져오기
    mapping = None
    ignore_unmapped = False
    if request.apply_mapping:
        stmt = select(Collection).where(Collection.id == request.collection_id)
        result = db.execute(stmt)
        collection = result.scalar_one_or_none()

        if collection and collection.field_mapping:
            mapping_config = collection.field_mapping
            if isinstance(mapping_config, dict):
                mapping = mapping_config.get("mapping", {})
                ignore_unmapped = mapping_config.get("ignore_unmapped", False)

    success_count = 0
    failed_count = 0
    items = []
    errors = []

    for idx, result in enumerate(results):
        if isinstance(result, Exception):
            failed_count += 1
            errors.append(f"URL {idx + 1}: {str(result)}")
            continue

        try:
            # 매핑 적용
            metadata = result
            if mapping:
                metadata = apply_field_mapping(result, mapping, ignore_unmapped)

            # 아이템 생성
            item = await create_item_service(
                db=db,
                collection_id=request.collection_id,
                metadata=metadata,
            )
            success_count += 1
            items.append({
                "id": str(item["_id"]),
                "metadata": item["metadata"],
            })
        except Exception as e:
            failed_count += 1
            errors.append(f"URL {idx + 1} 아이템 생성 실패: {str(e)}")

    return BulkScrapeResponse(
        total=len(urls),
        success=success_count,
        failed=failed_count,
        items=items,
        errors=errors,
    )


@router.post("/bulk-scrape-csv", response_model=BulkScrapeResponse)
async def bulk_scrape_from_csv(
    file: UploadFile = File(...),
    collection_id: int = Form(...),
    apply_mapping: bool = Form(False),
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """
    CSV 파일에서 URL 목록을 읽어 일괄 스크래핑
    CSV 형식: 첫 번째 컬럼에 URL
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능합니다.")

    try:
        # CSV 파일 읽기
        contents = await file.read()
        decoded = contents.decode('utf-8')
        csv_reader = csv.reader(io.StringIO(decoded))

        # 헤더 스킵 (선택적)
        urls = []
        for idx, row in enumerate(csv_reader):
            if idx == 0 and row and row[0].lower().strip() in ['url', 'link', '주소']:
                continue  # 헤더 스킵
            if row and row[0].strip():
                urls.append(row[0].strip())

        if not urls:
            raise HTTPException(status_code=400, detail="CSV 파일에 URL이 없습니다.")

        # 일괄 스크래핑
        results = await scrape_urls(urls)

        # 매핑 설정 가져오기
        mapping = None
        ignore_unmapped = False
        if apply_mapping:
            stmt = select(Collection).where(Collection.id == collection_id)
            result = db.execute(stmt)
            collection = result.scalar_one_or_none()

            if collection and collection.field_mapping:
                mapping_config = collection.field_mapping
                if isinstance(mapping_config, dict):
                    mapping = mapping_config.get("mapping", {})
                    ignore_unmapped = mapping_config.get("ignore_unmapped", False)

        success_count = 0
        failed_count = 0
        items = []
        errors = []

        for idx, result in enumerate(results):
            if isinstance(result, Exception):
                failed_count += 1
                errors.append(f"행 {idx + 1}: {str(result)}")
                continue

            try:
                # 매핑 적용
                metadata = result
                if mapping:
                    metadata = apply_field_mapping(result, mapping, ignore_unmapped)

                # 아이템 생성
                item = await create_item_service(
                    db=db,
                    collection_id=collection_id,
                    metadata=metadata,
                )
                success_count += 1
                items.append({
                    "id": str(item["_id"]),
                    "metadata": item["metadata"],
                })
            except Exception as e:
                failed_count += 1
                errors.append(f"행 {idx + 1} 아이템 생성 실패: {str(e)}")

        return BulkScrapeResponse(
            total=len(urls),
            success=success_count,
            failed=failed_count,
            items=items,
            errors=errors,
        )

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV 파일 인코딩 오류 (UTF-8 형식이어야 합니다)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV 처리 실패: {str(e)}")
