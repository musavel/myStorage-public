"""DeepL 번역 서비스"""
import logging
import re
import hashlib
import deepl
from fastapi import HTTPException

from backend.app.core.config import settings

logger = logging.getLogger(__name__)


async def translate_slug(text: str) -> str:
    """텍스트를 영문 slug로 번역 (DeepL API 사용)

    Args:
        text: 번역할 텍스트 (한글, 일본어 등 다국어 가능)

    Returns:
        str: URL-safe한 영문 slug
    """
    try:
        # DeepL API 키 확인
        if not settings.DEEPL_API_KEY:
            raise HTTPException(
                status_code=400,
                detail="DeepL API 키가 설정되지 않았습니다. 환경변수 DEEPL_API_KEY를 설정해주세요."
            )

        # DeepL 클라이언트 생성
        translator = deepl.Translator(settings.DEEPL_API_KEY)

        # 번역 실행
        result = translator.translate_text(text, target_lang="EN-US")
        translated = result.text

        logger.info(f"📝 DeepL 번역: {text} -> {translated}")

        # Slug 변환: 소문자, 공백을 하이픈으로, 특수문자 제거
        slug = translated.lower()
        slug = re.sub(r'[^\w\s-]', '', slug)  # 특수문자 제거
        slug = re.sub(r'[\s_]+', '-', slug)  # 공백/언더스코어를 하이픈으로
        slug = re.sub(r'-+', '-', slug)  # 연속 하이픈 제거
        slug = slug.strip('-')  # 앞뒤 하이픈 제거

        # 안전성 검증 - 영문, 숫자, 하이픈만 허용
        slug = re.sub(r'[^a-z0-9-]', '', slug)

        if not slug:
            # 번역 실패 시 fallback: 랜덤 해시
            slug_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:8]
            slug = f"collection-{slug_hash}"
            logger.warning(f"⚠️ Slug 번역 실패, fallback 사용: {slug}")

        logger.info(f"✅ Slug 번역 완료: {text} -> {slug}")
        return slug

    except HTTPException:
        raise
    except deepl.DeepLException as e:
        logger.error(f"❌ DeepL API 에러: {str(e)}")
        # Fallback: 랜덤 해시
        slug_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:8]
        return f"collection-{slug_hash}"
    except Exception as e:
        logger.error(f"❌ Slug 번역 실패: {str(e)}")
        # Fallback: 랜덤 해시
        slug_hash = hashlib.md5(text.encode('utf-8')).hexdigest()[:8]
        return f"collection-{slug_hash}"
