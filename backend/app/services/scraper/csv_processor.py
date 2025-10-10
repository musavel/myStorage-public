"""CSV 처리 및 일괄 스크래핑 서비스"""
import csv
import io
import json
import logging
from typing import Dict, List, Any, AsyncGenerator
from fastapi import UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.app.models.collection import Collection
from backend.app.schemas.item import ItemCreate
from backend.app.services.item.item_service import create_item as create_item_service
from backend.app.services.scraper.web_scraper import scrape_url, apply_field_mapping

logger = logging.getLogger(__name__)


async def process_csv_file(file: UploadFile) -> tuple[List[str], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    CSV 파일을 읽어서 URL 목록과 추가 데이터, 원본 row를 반환

    Args:
        file: 업로드된 CSV 파일

    Returns:
        (urls, additional_data, original_rows) 튜플
        - urls: URL 목록
        - additional_data: purchase_date 등 메타데이터에 병합할 데이터
        - original_rows: 원본 CSV row (CSV 재생성용)

    Raises:
        ValueError: CSV에 URL이 없거나 형식이 잘못된 경우
    """
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8')
    except UnicodeDecodeError:
        raise ValueError("CSV 파일 인코딩 오류 (UTF-8 형식이어야 합니다)")

    csv_reader = csv.DictReader(io.StringIO(decoded))

    urls = []
    additional_data = []
    original_rows = []

    for row in csv_reader:
        # URL 찾기
        url = None
        for key in row.keys():
            if key.lower() in ['url', 'link', '주소']:
                url = row[key].strip()
                break

        if url:
            urls.append(url)

            # 메타데이터에 병합할 추가 데이터 (title 제외)
            extra = {}
            for key, value in row.items():
                if key.lower() not in ['url', 'link', '주소', 'title'] and value.strip():
                    extra[key] = value.strip()
            additional_data.append(extra)

            # 원본 row 저장 (CSV 재생성용)
            original_rows.append(row)

    if not urls:
        raise ValueError("CSV 파일에 URL이 없습니다.")

    return urls, additional_data, original_rows


async def get_collection_mapping(collection_id: int, db: Session) -> tuple[Dict[str, str], bool]:
    """
    컬렉션의 필드 매핑 설정 조회

    Args:
        collection_id: 컬렉션 ID
        db: DB 세션

    Returns:
        (mapping, ignore_unmapped) 튜플
    """
    stmt = select(Collection).where(Collection.id == collection_id)
    result = db.execute(stmt)
    collection = result.scalar_one_or_none()

    if not collection:
        raise ValueError(f"컬렉션 ID {collection_id}를 찾을 수 없습니다.")

    mapping = {}
    ignore_unmapped = False

    if collection.field_mapping:
        mapping_config = collection.field_mapping
        if isinstance(mapping_config, dict):
            mapping = mapping_config.get("mapping", {})
            ignore_unmapped = mapping_config.get("ignore_unmapped", False)

    return mapping, ignore_unmapped


async def bulk_scrape_csv_stream(
    urls: List[str],
    additional_data: List[Dict[str, Any]],
    original_rows: List[Dict[str, Any]],
    collection_id: int,
    mapping: Dict[str, str],
    ignore_unmapped: bool,
    db: Session
) -> AsyncGenerator[str, None]:
    """
    CSV URL 목록을 하나씩 스크래핑하여 스트리밍으로 결과 전송

    Args:
        urls: URL 목록
        additional_data: 각 URL에 대한 추가 데이터
        original_rows: 원본 CSV row 데이터
        collection_id: 컬렉션 ID
        mapping: 필드 매핑
        ignore_unmapped: 매핑되지 않은 필드 무시 여부
        db: DB 세션

    Yields:
        Server-Sent Events 형식의 진행 상황 데이터
    """
    total = len(urls)
    success_count = 0
    failed_count = 0
    remaining_urls = []
    blocked = False  # 차단 여부 플래그

    # 시작 이벤트
    yield f"data: {json.dumps({'type': 'start', 'total': total})}\n\n"

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

            # 진행 상황 전송
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

            # Block 감지 (timeout, 403, rate limit, 제목 없음 등)
            is_blocked = (
                'timeout' in error_str or
                '403' in error_str or
                'blocked' in error_str or
                'rate limit' in error_str or
                '제목을 찾을 수 없습니다' in str(e) or
                '페이지 로딩이 실패' in str(e)
            )

            if is_blocked:
                # 현재 실패한 것 + 남은 URL 모두 수집 (원본 row 데이터 포함)
                for remaining_idx in range(idx, len(urls)):
                    remaining_data = {
                        'row': remaining_idx + 1,
                        'url': urls[remaining_idx]
                    }
                    # 원본 row 데이터가 있으면 포함
                    if remaining_idx < len(original_rows):
                        remaining_data['original_row'] = original_rows[remaining_idx]
                    remaining_urls.append(remaining_data)

                # Block 알림 (즉시 중단)
                block_data = {
                    'type': 'blocked',
                    'index': idx + 1,
                    'message': f'차단 또는 페이지 로딩 실패 감지 (행 {idx + 1}). 남은 {len(remaining_urls)}개 URL은 처리되지 않았습니다.',
                    'total': total,
                    'success': success_count,
                    'failed': failed_count,
                    'remaining_urls': remaining_urls
                }
                yield f"data: {json.dumps(block_data)}\n\n"
                blocked = True  # 차단 플래그 설정
                break  # 즉시 중단

            # 일반 에러 (계속 진행)
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

    # 완료 (차단되지 않은 경우만)
    if not blocked:
        complete_data = {
            'type': 'complete',
            'total': total,
            'success': success_count,
            'failed': failed_count
        }
        yield f"data: {json.dumps(complete_data)}\n\n"
