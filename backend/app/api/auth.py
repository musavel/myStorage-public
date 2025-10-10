"""인증 API 엔드포인트"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
import logging
import traceback

from backend.app.core.auth import get_current_user
from backend.app.services.auth import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleAuthRequest(BaseModel):
    """Google 인증 요청"""
    token: str  # Google ID Token


class UserInfo(BaseModel):
    """사용자 정보"""
    email: str
    name: str


class TokenResponse(BaseModel):
    """토큰 응답"""
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


@router.post("/google", response_model=TokenResponse)
async def google_auth_endpoint(auth_request: GoogleAuthRequest):
    """Google OAuth 인증 (Owner only)"""
    try:
        result = await auth_service.authenticate_google(auth_request.token)
        return TokenResponse(
            access_token=result["access_token"],
            token_type=result["token_type"],
            user=UserInfo(**result["user"])
        )
    except ValueError as e:
        logger.error(f"Google 토큰 검증 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"유효하지 않은 Google 토큰입니다: {str(e)}",
        )
    except HTTPException:
        # auth_service에서 발생한 HTTPException은 그대로 전달
        raise
    except Exception as e:
        logger.error(f"인증 처리 중 오류: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"인증 처리 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/me")
async def get_me_endpoint(email: str = Depends(get_current_user)):
    """현재 로그인한 사용자 정보"""
    return auth_service.get_user_info(email)
