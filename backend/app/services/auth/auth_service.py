"""인증 서비스"""
from fastapi import HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests

from backend.app.core.config import settings
from backend.app.core.auth import create_access_token


class TokenResponse:
    """토큰 응답 (임시, schemas에서 import 예정)"""
    def __init__(self, access_token: str, token_type: str, user: dict):
        self.access_token = access_token
        self.token_type = token_type
        self.user = user


async def verify_google_token(token: str) -> tuple[str, str]:
    """
    Google ID Token 검증

    Args:
        token: Google ID Token

    Returns:
        (email, name) 튜플

    Raises:
        ValueError: 토큰이 유효하지 않은 경우
    """
    try:
        # Google ID Token 검증 (clock_skew_in_seconds로 시간 오차 허용)
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10  # 10초 시간 오차 허용
        )

        # 이메일 및 이름 추출
        email = idinfo.get("email")
        name = idinfo.get("name") or (email.split("@")[0] if email else None)

        if not email:
            raise ValueError("이메일 정보를 찾을 수 없습니다")

        return email, name

    except Exception as e:
        raise ValueError(f"Google 토큰 검증 실패: {str(e)}")


def verify_owner(email: str) -> None:
    """
    소유자 확인

    Args:
        email: 확인할 이메일

    Raises:
        HTTPException: 소유자가 아닌 경우
    """
    if email != settings.OWNER_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="소유자만 로그인할 수 있습니다",
        )


async def authenticate_google(token: str) -> dict:
    """
    Google 토큰 검증 및 인증

    Args:
        token: Google ID Token

    Returns:
        인증 결과 (access_token, user 정보)

    Raises:
        ValueError: 토큰이 유효하지 않은 경우
        HTTPException: 소유자가 아닌 경우
    """
    # 1. Google ID Token 검증
    email, name = await verify_google_token(token)

    # 2. 소유자 확인
    verify_owner(email)

    # 3. JWT 토큰 생성
    access_token = create_access_token(data={"email": email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": email,
            "name": name
        }
    }


def get_user_info(email: str) -> dict:
    """
    사용자 정보 조회

    Args:
        email: 사용자 이메일

    Returns:
        사용자 정보
    """
    return {
        "email": email,
        "is_owner": email == settings.OWNER_EMAIL
    }
