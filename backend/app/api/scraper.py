"""스크래핑 API 엔드포인트"""
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import csv
import io
import json
import logging
import traceback
import asyncio

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
from ..schemas.item import ItemCreate
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
        item_data = ItemCreate(
            collection_id=request.collection_id,
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
            item_data = ItemCreate(
                collection_id=request.collection_id,
                metadata=metadata
            )
            item = await create_item_service(item_data, db)
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
        csv_reader = csv.DictReader(io.StringIO(decoded))

        # URL과 추가 데이터 수집
        urls = []
        additional_data = []  # 각 URL에 대한 추가 데이터 (title, purchase_date 등)

        for row in csv_reader:
            # URL 필드 찾기 (대소문자 구분 없이)
            url = None
            for key in row.keys():
                if key.lower() in ['url', 'link', '주소']:
                    url = row[key].strip()
                    break

            if url:
                urls.append(url)
                # 추가 데이터 수집 (purchase_date 등, title은 제외 - 메모용)
                extra = {}
                for key, value in row.items():
                    if key.lower() not in ['url', 'link', '주소', 'title'] and value.strip():
                        extra[key] = value.strip()
                additional_data.append(extra)

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
                # 스크래핑 결과에 CSV 추가 데이터 병합
                metadata = result.copy()
                if idx < len(additional_data):
                    # CSV의 추가 데이터를 스크래핑 결과에 병합 (CSV 데이터가 우선)
                    metadata.update(additional_data[idx])

                # 매핑 적용
                if mapping:
                    metadata = apply_field_mapping(metadata, mapping, ignore_unmapped)

                # 아이템 생성
                item_data = ItemCreate(
                    collection_id=collection_id,
                    metadata=metadata
                )
                item = await create_item_service(item_data, db)
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


@router.post("/bulk-scrape-csv-stream")
async def bulk_scrape_from_csv_stream(
    file: UploadFile = File(...),
    collection_id: int = Form(...),
    apply_mapping: bool = Form(False),
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """
    CSV 파일에서 URL 목록을 읽어 일괄 스크래핑 (스트리밍)
    실시간 진행 상황을 Server-Sent Events로 전송
    """
    async def generate():
        try:
            if not file.filename.endswith('.csv'):
                yield f"data: {json.dumps({'type': 'error', 'message': 'CSV 파일만 업로드 가능합니다.'})}\n\n"
                return

            # CSV 파일 읽기
            contents = await file.read()
            decoded = contents.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(decoded))

            # URL과 추가 데이터 수집
            urls = []
            additional_data = []

            for row in csv_reader:
                url = None
                for key in row.keys():
                    if key.lower() in ['url', 'link', '주소']:
                        url = row[key].strip()
                        break

                if url:
                    urls.append(url)
                    extra = {}
                    for key, value in row.items():
                        if key.lower() not in ['url', 'link', '주소', 'title'] and value.strip():
                            extra[key] = value.strip()
                    additional_data.append(extra)

            if not urls:
                yield f"data: {json.dumps({'type': 'error', 'message': 'CSV 파일에 URL이 없습니다.'})}\n\n"
                return

            total = len(urls)
            yield f"data: {json.dumps({'type': 'start', 'total': total})}\n\n"

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
            blocked = False
            remaining_urls = []

            # 하나씩 처리
            for idx, url in enumerate(urls):
                try:
                    # 스크래핑
                    metadata = await scrape_url(url)

                    # CSV 추가 데이터 병합
                    if idx < len(additional_data):
                        metadata.update(additional_data[idx])

                    # 매핑 적용
                    if mapping:
                        metadata = apply_field_mapping(metadata, mapping, ignore_unmapped)

                    # 아이템 생성
                    item_data = ItemCreate(
                        collection_id=collection_id,
                        metadata=metadata
                    )
                    item = await create_item_service(item_data, db)
                    success_count += 1

                    # 진행 상황 전송 (생성된 아이템 정보 포함)
                    progress = {
                        'type': 'progress',
                        'current': idx + 1,
                        'total': total,
                        'success': success_count,
                        'failed': failed_count,
                        'progress': round(((idx + 1) / total) * 100, 2),
                        'item': {
                            'id': str(item['_id']),
                            'metadata': item['metadata']
                        }
                    }
                    yield f"data: {json.dumps(progress)}\n\n"

                except Exception as e:
                    error_str = str(e).lower()

                    # Block 감지 (timeout, 403, rate limit 등)
                    if 'timeout' in error_str or '403' in error_str or 'blocked' in error_str or 'rate limit' in error_str:
                        blocked = True
                        # 남은 URL 수집
                        for remaining_idx in range(idx, len(urls)):
                            remaining_urls.append({
                                'row': remaining_idx + 1,
                                'url': urls[remaining_idx]
                            })

                        # Block 알림
                        block_data = {
                            'type': 'blocked',
                            'index': idx + 1,
                            'message': f'교보문고 차단 감지 (행 {idx + 1}). 잠시 후 다시 시도해주세요.',
                            'total': total,
                            'success': success_count,
                            'failed': failed_count,
                            'remaining_urls': remaining_urls
                        }
                        yield f"data: {json.dumps(block_data)}\n\n"
                        break

                    failed_count += 1
                    error_msg = f"행 {idx + 1}: {str(e)}"

                    # 에러 전송
                    error_data = {
                        'type': 'error_item',
                        'index': idx + 1,
                        'message': error_msg,
                        'current': idx + 1,
                        'total': total,
                        'success': success_count,
                        'failed': failed_count,
                        'progress': round(((idx + 1) / total) * 100, 2)
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"

            # 완료
            complete_data = {
                'type': 'complete',
                'total': total,
                'success': success_count,
                'failed': failed_count
            }
            yield f"data: {json.dumps(complete_data)}\n\n"

        except Exception as e:
            logger.error(f"스트리밍 처리 실패: {str(e)}\n{traceback.format_exc()}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
