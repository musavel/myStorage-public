from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from authlib.integrations.starlette_client import OAuth
from backend.app.core.config import settings
from backend.app.core.auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth 설정
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


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
async def google_auth(auth_request: GoogleAuthRequest):
    """Google OAuth 인증"""
    try:
        # Google ID Token 검증 (프론트엔드에서 받은 토큰)
        # 실제 프로덕션에서는 google.oauth2.id_token을 사용해서 검증해야 함
        # 여기서는 간단하게 처리
        from google.oauth2 import id_token
        from google.auth.transport import requests

        # Google ID Token 검증
        idinfo = id_token.verify_oauth2_token(
            auth_request.token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )

        # 이메일 및 이름 추출
        email = idinfo.get("email")
        name = idinfo.get("name") or email.split("@")[0]  # 이름이 없으면 이메일 앞부분 사용

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이메일 정보를 찾을 수 없습니다",
            )

        # 소유자 확인
        if email != settings.OWNER_EMAIL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="소유자만 로그인할 수 있습니다",
            )

        # JWT 토큰 생성
        access_token = create_access_token(data={"email": email})

        return TokenResponse(
            access_token=access_token,
            user=UserInfo(email=email, name=name)
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"유효하지 않은 Google 토큰입니다: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"인증 처리 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/me")
async def get_me(email: str = Depends(get_current_user)):
    """현재 로그인한 사용자 정보"""
    return {"email": email, "is_owner": email == settings.OWNER_EMAIL}
