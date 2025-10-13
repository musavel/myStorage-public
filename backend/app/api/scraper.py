"""스크래핑 API 엔드포인트"""
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
import logging
import traceback
import json

from ..db import get_db
from ..core.auth import require_owner
from ..schemas.scraper import (
    ScrapeUrlRequest,
    ScrapeUrlResponse,
    FieldMappingRequest,
)
from ..services.scraper import mapping_service
from ..services.scraper import scraper_service
from ..services.scraper.csv_processor import (
    process_csv_file,
    get_collection_mapping,
    bulk_scrape_csv_stream,
    get_remaining_csv
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scraper", tags=["scraper"])


@router.post("/save-mapping")
async def save_field_mapping_endpoint(
    request: FieldMappingRequest,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """컬렉션의 필드 매핑 저장 (Owner only)"""
    return await mapping_service.save_field_mapping(
        collection_id=request.collection_id,
        mapping=request.mapping,
        ignore_unmapped=request.ignore_unmapped,
        db=db
    )


@router.get("/get-mapping/{collection_id}")
async def get_field_mapping_endpoint(
    collection_id: int,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """컬렉션의 저장된 필드 매핑 조회 (Owner only)"""
    return await mapping_service.get_field_mapping(collection_id, db)


@router.delete("/delete-mapping/{collection_id}")
async def delete_field_mapping_endpoint(
    collection_id: int,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """컬렉션의 저장된 필드 매핑 삭제 (Owner only)"""
    return await mapping_service.delete_field_mapping(collection_id, db)


@router.post("/scrape-url", response_model=ScrapeUrlResponse)
async def scrape_single_url_endpoint(
    request: ScrapeUrlRequest,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """단일 URL 스크래핑 (매핑 적용 옵션, Owner only)"""
    try:
        logger.info(f"스크래핑 시작: {request.url}")
        metadata = await scraper_service.scrape_url_with_mapping(
            url=str(request.url),
            collection_id=request.collection_id,
            apply_mapping=request.apply_mapping,
            db=db
        )
        logger.info(f"스크래핑 완료: {len(metadata)} 필드")

        return ScrapeUrlResponse(
            metadata=metadata,
            source_url=str(request.url),
        )
    except ValueError as e:
        error_msg = str(e)
        logger.error(f"스크래핑 실패: {error_msg}\n{traceback.format_exc()}")

        # 제목을 찾을 수 없는 경우 (차단 가능성)
        if "제목을 찾을 수 없습니다" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="페이지가 차단되었거나 접근할 수 없습니다. 잠시 후 다시 시도해주세요."
            )

        # 기타 ValueError
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"스크래핑 실패: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"스크래핑 실패: {str(e)}")


@router.post("/scrape-and-create", response_model=dict)
async def scrape_and_create_item_endpoint(
    request: ScrapeUrlRequest,
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """URL 스크래핑 후 아이템 생성 (Owner only)"""
    try:
        logger.info(f"스크래핑 및 아이템 생성 시작: {request.url}")
        return await scraper_service.scrape_and_create(
            url=str(request.url),
            collection_id=request.collection_id,
            db=db
        )
    except Exception as e:
        logger.error(f"아이템 생성 실패: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"아이템 생성 실패: {str(e)}")


@router.post("/bulk-scrape-csv-stream")
async def bulk_scrape_from_csv_stream_endpoint(
    file: UploadFile = File(...),
    collection_id: int = Form(...),
    apply_mapping: bool = Form(False),
    db: Session = Depends(get_db),
    email: str = Depends(require_owner),
):
    """CSV 파일에서 URL 일괄 스크래핑 (스트리밍, Owner only)"""
    async def generate():
        try:
            # CSV 파일 검증
            if not file.filename.endswith('.csv'):
                yield f"data: {json.dumps({'type': 'error', 'message': 'CSV 파일만 업로드 가능합니다.'})}\n\n"
                return

            # CSV 파싱
            urls, additional_data, original_rows = await process_csv_file(file)

            # 매핑 설정 가져오기
            mapping, ignore_unmapped = {}, False
            if apply_mapping:
                mapping, ignore_unmapped = await get_collection_mapping(collection_id, db)

            # 스트리밍 처리
            async for event in bulk_scrape_csv_stream(
                urls=urls,
                additional_data=additional_data,
                original_rows=original_rows,
                collection_id=collection_id,
                mapping=mapping,
                ignore_unmapped=ignore_unmapped,
                db=db
            ):
                yield event

        except ValueError as e:
            # CSV 파싱 에러
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        except Exception as e:
            logger.error(f"스트리밍 처리 실패: {str(e)}\n{traceback.format_exc()}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/download-remaining-csv/{token}")
async def download_remaining_csv_endpoint(
    token: str,
    email: str = Depends(require_owner),
):
    """차단된 남은 URL CSV 다운로드 (Owner only)"""
    csv_content = get_remaining_csv(token)

    if not csv_content:
        raise HTTPException(status_code=404, detail="다운로드 토큰이 유효하지 않거나 만료되었습니다.")

    return Response(
        content=csv_content.encode('utf-8'),
        media_type='text/csv; charset=utf-8',
        headers={
            'Content-Disposition': 'attachment; filename="remaining_urls.csv"'
        }
    )
