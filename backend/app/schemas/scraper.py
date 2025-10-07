"""스크래핑 관련 스키마"""
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any


class FieldMappingRequest(BaseModel):
    """필드 매핑 저장 요청"""
    collection_id: int
    mapping: Dict[str, str]  # {"title": "책제목", "author": "저자명", ...}
    ignore_unmapped: bool = True  # 매핑 안 된 필드 무시 여부


class ScrapeUrlRequest(BaseModel):
    """URL 스크래핑 요청"""
    url: HttpUrl
    collection_id: int
    apply_mapping: bool = True  # 저장된 매핑 적용 여부


class ScrapeUrlResponse(BaseModel):
    """URL 스크래핑 응답"""
    metadata: Dict[str, Any]
    source_url: str


class BulkScrapeRequest(BaseModel):
    """일괄 스크래핑 요청"""
    urls: list[HttpUrl]
    collection_id: int


class BulkScrapeProgress(BaseModel):
    """일괄 스크래핑 진행 상황"""
    total: int
    completed: int
    failed: int
    progress: float  # 0-100
    current_url: Optional[str] = None


class BulkScrapeResponse(BaseModel):
    """일괄 스크래핑 응답"""
    total: int
    success: int
    failed: int
    items: list[Dict[str, Any]]
    errors: list[str]
