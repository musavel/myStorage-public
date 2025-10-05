from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # PostgreSQL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/mystorage"

    # MongoDB
    MONGO_URL: str = "mongodb://admin:admin@localhost:27017"
    MONGO_DB: str = "mystorage"

    # 인증
    SECRET_KEY: str = "your-secret-key-change-this"
    OWNER_EMAIL: str = "your-email@gmail.com"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # AI API Keys
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # 서버
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
