#!/bin/bash

echo "🗑️  데이터베이스 초기화 시작..."

# Docker 컨테이너 중지
echo "1. Docker 컨테이너 중지..."
docker-compose down

# Docker 볼륨 삭제 (모든 데이터 삭제)
echo "2. 데이터베이스 볼륨 삭제..."
docker volume rm mystorage_postgres_data 2>/dev/null || echo "  - PostgreSQL 볼륨 없음"
docker volume rm mystorage_mongo_data 2>/dev/null || echo "  - MongoDB 볼륨 없음"

# 컨테이너 재시작
echo "3. 컨테이너 재시작..."
docker-compose up -d --build

echo ""
echo "✅ 데이터베이스 초기화 완료!"
echo "📝 컬렉션 예시는 COLLECTION_EXAMPLES.md 참고"
echo ""
echo "접속 정보:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- API 문서: http://localhost:8000/docs"
