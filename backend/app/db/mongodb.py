from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.core.config import settings

# MongoDB 클라이언트
mongodb_client: AsyncIOMotorClient = None


def get_mongodb_client() -> AsyncIOMotorClient:
    """MongoDB 클라이언트 반환"""
    return mongodb_client


def get_database():
    """MongoDB 데이터베이스 반환"""
    return mongodb_client[settings.MONGO_DB]


async def connect_to_mongodb():
    """MongoDB 연결"""
    global mongodb_client
    mongodb_client = AsyncIOMotorClient(settings.MONGO_URL)
    # 연결 테스트
    await mongodb_client.admin.command('ping')
    print(f"✅ MongoDB 연결 성공: {settings.MONGO_DB}")


async def close_mongodb_connection():
    """MongoDB 연결 종료"""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("❌ MongoDB 연결 종료")
