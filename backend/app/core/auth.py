from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

# JWT 설정
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24시간

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """JWT 토큰 검증"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 인증 토큰입니다",
        )


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """현재 로그인한 사용자 이메일 가져오기"""
    token = credentials.credentials
    payload = verify_token(token)
    email: str = payload.get("email")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 정보를 찾을 수 없습니다",
        )
    return email


def require_owner(current_user: str = Depends(get_current_user)) -> str:
    """소유자 권한 확인"""
    if current_user != settings.OWNER_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="소유자만 접근 가능합니다",
        )
    return current_user


def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[str]:
    """현재 로그인한 사용자 이메일 가져오기 (선택적 - 로그인 안 해도 됨)"""
    if credentials is None:
        return None
    try:
        token = credentials.credentials
        payload = verify_token(token)
        email: str = payload.get("email")
        return email
    except:
        return None


def is_owner(current_user: Optional[str] = Depends(get_current_user_optional)) -> bool:
    """현재 사용자가 Owner인지 확인"""
    return current_user == settings.OWNER_EMAIL if current_user else False
