"""CSV 처리 및 일괄 스크래핑 서비스"""
import csv
import io
import json
import logging
import uuid
from typing import Dict, List, Any, AsyncGenerator
from fastapi import UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.app.models.collection import Collection
from backend.app.schemas.item import ItemCreate
from backend.app.services.item.item_service import create_item as create_item_service
from backend.app.services.scraper.web_scraper import scrape_url, apply_field_mapping

logger = logging.getLogger(__name__)

# 임시 저장소 (메모리)
_temp_csv_storage: Dict[str, str] = {}


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


def generate_remaining_csv(remaining_urls: List[Dict[str, Any]]) -> str:
    """
    남은 URL 목록을 CSV 문자열로 변환

    Args:
        remaining_urls: 남은 URL 목록 (original_row 포함)

    Returns:
        CSV 문자열 (UTF-8 BOM 포함)
    """
    if not remaining_urls:
        return ""

    # 헤더 추출 (첫 번째 항목의 original_row에서)
    first_row = remaining_urls[0].get('original_row', {})
    headers = list(first_row.keys()) if first_row else ['URL']

    # CSV 생성
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()

    for item in remaining_urls:
        if item.get('original_row'):
            writer.writerow(item['original_row'])
        else:
            # original_row가 없으면 URL만 사용
            row_data = {header: '' for header in headers}
            for header in headers:
                if header.lower() in ['url', 'link', '주소']:
                    row_data[header] = item['url']
            writer.writerow(row_data)

    # UTF-8 BOM 추가
    csv_content = '\ufeff' + output.getvalue()
    return csv_content


def store_remaining_csv(csv_content: str) -> str:
    """
    CSV 내용을 임시 저장소에 저장하고 토큰 반환

    Args:
        csv_content: CSV 문자열

    Returns:
        다운로드 토큰
    """
    token = str(uuid.uuid4())
    _temp_csv_storage[token] = csv_content
    return token


def get_remaining_csv(token: str) -> str | None:
    """
    토큰으로 CSV 내용 조회

    Args:
        token: 다운로드 토큰

    Returns:
        CSV 문자열 또는 None
    """
    return _temp_csv_storage.pop(token, None)


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
        scraping_failed = False
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
            # 스크래핑 실패 플래그 설정
            scraping_failed = True
            error_str = str(e)

            # Block 감지: "제목을 찾을 수 없습니다" 에러만 차단으로 간주
            is_blocked = '제목을 찾을 수 없습니다' in error_str

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

                logger.info(f"[BLOCKED] 차단 감지 - 전체: {total}, 성공: {success_count}, 실패: {failed_count}, 남은 URL: {len(remaining_urls)}개")

                # CSV 생성 및 저장
                csv_content = generate_remaining_csv(remaining_urls)
                download_token = store_remaining_csv(csv_content)
                logger.info(f"[BLOCKED] CSV 생성 완료 - 토큰: {download_token}, 크기: {len(csv_content)} bytes")

                # Block 알림 (토큰만 전송)
                block_data = {
                    'type': 'blocked',
                    'index': idx + 1,
                    'message': f'차단 또는 페이지 로딩 실패 감지 (행 {idx + 1}). 남은 {len(remaining_urls)}개 URL은 처리되지 않았습니다.',
                    'total': total,
                    'success': success_count,
                    'failed': failed_count,
                    'remaining_count': len(remaining_urls),
                    'download_token': download_token
                }
                yield f"data: {json.dumps(block_data)}\n\n"

                # 차단 시에도 complete 이벤트 전송 (프론트엔드에서 최종 상태 확인용)
                complete_data = {
                    'type': 'complete',
                    'total': total,
                    'success': success_count,
                    'failed': failed_count,
                    'blocked': True
                }
                yield f"data: {json.dumps(complete_data)}\n\n"

                return  # 즉시 종료

        # 스크래핑 실패 시 fallback: CSV 데이터만으로 아이템 생성 (차단이 아닌 일반 에러만)
        if scraping_failed and not blocked:
            try:
                # CSV 데이터만 사용 (원본 row에서 추출)
                fallback_metadata = {}
                if idx < len(original_rows):
                    row = original_rows[idx]
                    # URL 제외한 모든 CSV 데이터 사용
                    for key, value in row.items():
                        if key.lower() not in ['url', 'link', '주소'] and value.strip():
                            fallback_metadata[key] = value.strip()

                # source_url 추가
                fallback_metadata['source_url'] = url

                # 매핑 적용
                if mapping:
                    fallback_metadata = apply_field_mapping(fallback_metadata, mapping, ignore_unmapped)

                # 아이템 생성
                item_data = ItemCreate(
                    collection_id=collection_id,
                    metadata=fallback_metadata
                )
                item = await create_item_service(item_data, db)
                failed_count += 1  # 실패로 카운트

                # 실패로 표시하되 아이템은 생성됨
                error_data = {
                    'type': 'error_item',
                    'index': idx + 1,
                    'message': f"행 {idx + 1}: 스크래핑 실패 ({error_str}). CSV 데이터로 아이템 생성됨.",
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
                yield f"data: {json.dumps(error_data)}\n\n"

            except Exception as fallback_error:
                # fallback도 실패한 경우 (일반 에러 처리)
                failed_count += 1
                error_msg = f"행 {idx + 1}: 스크래핑 및 CSV 저장 실패 ({str(fallback_error)})"

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

    # 완료 (정상 완료 시)
    complete_data = {
        'type': 'complete',
        'total': total,
        'success': success_count,
        'failed': failed_count
    }
    yield f"data: {json.dumps(complete_data)}\n\n"
