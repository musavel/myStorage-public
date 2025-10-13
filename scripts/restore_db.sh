#!/bin/bash

# 데이터베이스 복원 스크립트
# 백업된 PostgreSQL과 MongoDB 데이터를 복원합니다.

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 스크립트 디렉토리
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/data/backups"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              myStorage 데이터베이스 복원                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 백업 파일 확인
if [ -z "$1" ]; then
    echo -e "${RED}❌ 백업 파일을 지정해주세요.${NC}"
    echo ""
    echo -e "${YELLOW}사용법:${NC}"
    echo "   $0 <backup_file.tar.gz>"
    echo ""
    echo -e "${YELLOW}사용 가능한 백업 파일:${NC}"
    ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'
    echo ""
    exit 1
fi

BACKUP_FILE="$1"

# 절대 경로로 변환
if [[ ! "$BACKUP_FILE" = /* ]]; then
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ 백업 파일을 찾을 수 없습니다: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📁 백업 파일: ${NC}$BACKUP_FILE"
echo ""

# 확인 요청
echo -e "${YELLOW}⚠️  경고: 현재 데이터베이스의 모든 데이터가 삭제되고 백업으로 대체됩니다!${NC}"
echo -e "${YELLOW}   계속하시겠습니까? (yes/no)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}복원 취소됨${NC}"
    exit 0
fi

echo ""

# .env 파일 로드
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}❌ .env 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

source "$PROJECT_DIR/.env"

# 임시 디렉토리 생성
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 압축 해제
echo -e "${BLUE}📦 백업 파일 압축 해제 중...${NC}"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

BACKUP_NAME=$(ls "$TEMP_DIR" | head -n 1)
RESTORE_DIR="$TEMP_DIR/$BACKUP_NAME"

echo -e "${GREEN}✅ 압축 해제 완료${NC}"
echo ""

# PostgreSQL 복원
echo -e "${BLUE}🐘 PostgreSQL 복원 시작...${NC}"

POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ PostgreSQL 컨테이너를 찾을 수 없습니다.${NC}"
    exit 1
fi

echo -e "${YELLOW}   컨테이너: ${NC}$POSTGRES_CONTAINER"

# 기존 연결 종료
echo -e "${YELLOW}   기존 연결 종료 중...${NC}"
docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
    >/dev/null 2>&1 || true

# 데이터베이스 삭제 및 재생성
echo -e "${YELLOW}   데이터베이스 재생성 중...${NC}"
docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" >/dev/null
docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;" >/dev/null

# SQL 파일 복원
SQL_FILE=$(ls "$RESTORE_DIR"/postgres_*.sql | head -n 1)
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ PostgreSQL 백업 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

echo -e "${YELLOW}   데이터 복원 중...${NC}"
docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$SQL_FILE" >/dev/null

echo -e "${GREEN}✅ PostgreSQL 복원 완료${NC}"
echo ""

# MongoDB 복원
echo -e "${BLUE}🍃 MongoDB 복원 시작...${NC}"

MONGO_CONTAINER=$(docker ps --filter "name=mongo" --format "{{.Names}}" | head -n 1)

if [ -z "$MONGO_CONTAINER" ]; then
    echo -e "${RED}❌ MongoDB 컨테이너를 찾을 수 없습니다.${NC}"
    exit 1
fi

echo -e "${YELLOW}   컨테이너: ${NC}$MONGO_CONTAINER"

# MongoDB 백업 디렉토리 확인
MONGO_BACKUP_DIR="$RESTORE_DIR/mongodb"
if [ ! -d "$MONGO_BACKUP_DIR" ]; then
    echo -e "${RED}❌ MongoDB 백업 디렉토리를 찾을 수 없습니다.${NC}"
    exit 1
fi

# 기존 데이터베이스 삭제
echo -e "${YELLOW}   기존 데이터베이스 삭제 중...${NC}"
docker exec "$MONGO_CONTAINER" mongosh "$MONGO_DB" \
    --username "$MONGO_USER" \
    --password "$MONGO_PASSWORD" \
    --authenticationDatabase admin \
    --eval "db.dropDatabase()" >/dev/null

# macOS 리소스 포크 파일 제거 (._*)
find "$MONGO_BACKUP_DIR" -name "._*" -type f -delete 2>/dev/null || true

# 백업 파일 복사
docker cp "$MONGO_BACKUP_DIR" "$MONGO_CONTAINER:/tmp/mongodb_restore"

# mongorestore 실행
echo -e "${YELLOW}   데이터 복원 중...${NC}"
docker exec "$MONGO_CONTAINER" mongorestore \
    --username="$MONGO_USER" \
    --password="$MONGO_PASSWORD" \
    --authenticationDatabase=admin \
    --db="$MONGO_DB" \
    /tmp/mongodb_restore >/dev/null

# 임시 파일 삭제
docker exec "$MONGO_CONTAINER" rm -rf /tmp/mongodb_restore

echo -e "${GREEN}✅ MongoDB 복원 완료${NC}"
echo ""

# 완료
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    복원 완료!                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}💡 백엔드 서비스를 재시작하는 것을 권장합니다:${NC}"
echo "   docker restart mystorage-backend-1"
echo ""
