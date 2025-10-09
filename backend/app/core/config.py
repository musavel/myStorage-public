from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # PostgreSQL
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "mystorage"

    # MongoDB
    MONGO_HOST: str = "localhost"
    MONGO_PORT: int = 27017
    MONGO_USER: str = "admin"
    MONGO_PASSWORD: str = "admin"
    MONGO_DB: str = "mystorage"

    # 인증
    SECRET_KEY: str = "your-secret-key-change-this"
    OWNER_EMAIL: str = "your-email@gmail.com"
    OWNER_NAME: str = "Owner"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # AI API Keys
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEEPL_API_KEY: str = ""  # DeepL 번역 API (슬러그 생성용)

    # 서버
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def DATABASE_URL(self) -> str:
        """PostgreSQL 연결 URL 생성"""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def MONGO_URL(self) -> str:
        """MongoDB 연결 URL 생성"""
        return f"mongodb://{self.MONGO_USER}:{self.MONGO_PASSWORD}@{self.MONGO_HOST}:{self.MONGO_PORT}"


settings = Settings()
