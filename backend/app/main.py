from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api import collections_router, books_router, board_games_router, auth_router
from backend.app.db import Base, engine

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="myStorage API",
    description="개인 소장품 관리 시스템 API",
    version="1.0.0"
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
app.include_router(books_router, prefix="/api")
app.include_router(board_games_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Welcome to myStorage API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
