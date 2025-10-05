from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.api import collections_router, auth_router
from backend.app.api.items import router as items_router
from backend.app.api.ai import router as ai_router
from backend.app.db import Base, engine
from backend.app.db.mongodb import connect_to_mongodb, close_mongodb_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작/종료 시 실행"""
    # 시작 시
    Base.metadata.create_all(bind=engine)  # PostgreSQL 테이블 생성
    await connect_to_mongodb()  # MongoDB 연결
    yield
    # 종료 시
    await close_mongodb_connection()  # MongoDB 연결 종료


app = FastAPI(
    title="myStorage API",
    description="개인 소장품 관리 시스템 API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router, prefix="/api")
app.include_router(collections_router, prefix="/api")
app.include_router(items_router, prefix="/api")
app.include_router(ai_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Welcome to myStorage API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
