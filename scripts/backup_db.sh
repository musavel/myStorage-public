#!/bin/bash

# 데이터베이스 백업 스크립트
# PostgreSQL과 MongoDB 데이터를 백업합니다.

set -e  # 에러 발생 시 스크립트 중단

# 기본값
CLEANUP=false
CLEANUP_DAYS=7

# 옵션 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --cleanup)
            CLEANUP=true
            shift
            ;;
        --cleanup-days)
            CLEANUP_DAYS="$2"
            CLEANUP=true
            shift 2
            ;;
        -h|--help)
            echo "사용법: $0 [옵션]"
            echo ""
            echo "옵션:"
            echo "  --cleanup              백업 후 오래된 백업 파일 자동 삭제"
            echo "  --cleanup-days N       N일 이상 된 백업 삭제 (기본값: 7일, --cleanup 필요)"
            echo "  -h, --help             도움말 표시"
            echo ""
            echo "예시:"
            echo "  $0                              # 백업만 실행"
            echo "  $0 --cleanup                    # 백업 후 7일 이상 된 백업 삭제"
            echo "  $0 --cleanup --cleanup-days 30  # 백업 후 30일 이상 된 백업 삭제"
            exit 0
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            echo "$0 --help 로 도움말을 확인하세요."
            exit 1
            ;;
    esac
done

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

# 현재 날짜/시간
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_${TIMESTAMP}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              myStorage 데이터베이스 백업                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# .env 파일 로드
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}❌ .env 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

source "$PROJECT_DIR/.env"

# 환경변수 확인
if [ -z "$POSTGRES_HOST" ] || [ -z "$MONGO_HOST" ]; then
    echo -e "${RED}❌ 필요한 환경변수가 설정되지 않았습니다.${NC}"
    exit 1
fi

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

echo -e "${YELLOW}📁 백업 디렉토리: ${NC}$BACKUP_DIR/$BACKUP_NAME"
echo ""

# PostgreSQL 백업
echo -e "${BLUE}🐘 PostgreSQL 백업 시작...${NC}"

# Docker 컨테이너 이름 찾기
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ PostgreSQL 컨테이너를 찾을 수 없습니다.${NC}"
    exit 1
fi

echo -e "${YELLOW}   컨테이너: ${NC}$POSTGRES_CONTAINER"

# pg_dump 실행
docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    > "$BACKUP_DIR/$BACKUP_NAME/postgres_${POSTGRES_DB}.sql"

POSTGRES_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME/postgres_${POSTGRES_DB}.sql" | cut -f1)
echo -e "${GREEN}✅ PostgreSQL 백업 완료 (${POSTGRES_SIZE})${NC}"
echo ""

# MongoDB 백업
echo -e "${BLUE}🍃 MongoDB 백업 시작...${NC}"

# Docker 컨테이너 이름 찾기
MONGO_CONTAINER=$(docker ps --filter "name=mongo" --format "{{.Names}}" | head -n 1)

if [ -z "$MONGO_CONTAINER" ]; then
    echo -e "${RED}❌ MongoDB 컨테이너를 찾을 수 없습니다.${NC}"
    exit 1
fi

echo -e "${YELLOW}   컨테이너: ${NC}$MONGO_CONTAINER"

# mongodump 실행
docker exec "$MONGO_CONTAINER" mongodump \
    --username="$MONGO_USER" \
    --password="$MONGO_PASSWORD" \
    --authenticationDatabase=admin \
    --db="$MONGO_DB" \
    --out=/tmp/mongodump

# 백업 파일 복사
docker cp "$MONGO_CONTAINER:/tmp/mongodump/$MONGO_DB" "$BACKUP_DIR/$BACKUP_NAME/mongodb"

# 임시 파일 삭제
docker exec "$MONGO_CONTAINER" rm -rf /tmp/mongodump

MONGO_SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_NAME/mongodb" | cut -f1)
echo -e "${GREEN}✅ MongoDB 백업 완료 (${MONGO_SIZE})${NC}"
echo ""

# 백업 정보 저장
cat > "$BACKUP_DIR/$BACKUP_NAME/backup_info.txt" <<EOF
백업 날짜: $(date +"%Y-%m-%d %H:%M:%S")
PostgreSQL DB: $POSTGRES_DB
MongoDB DB: $MONGO_DB

파일:
- postgres_${POSTGRES_DB}.sql (PostgreSQL 덤프)
- mongodb/ (MongoDB BSON 파일들)
EOF

# 압축 (선택 사항)
echo -e "${BLUE}📦 백업 압축 중...${NC}"
cd "$BACKUP_DIR"
# macOS의 ._* 파일(리소스 포크) 제외
COPYFILE_DISABLE=1 tar --exclude='._*' -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
COMPRESSED_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)

# 원본 디렉토리 삭제
rm -rf "$BACKUP_NAME"

echo -e "${GREEN}✅ 압축 완료 (${COMPRESSED_SIZE})${NC}"
echo ""

# 완료
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    백업 완료!                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}백업 파일: ${NC}$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo ""

# 오래된 백업 정리 (옵션)
if [ "$CLEANUP" = true ]; then
    OLD_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$CLEANUP_DAYS 2>/dev/null)
    if [ ! -z "$OLD_BACKUPS" ]; then
        echo -e "${YELLOW}🗑️  ${CLEANUP_DAYS}일 이상 된 백업 삭제:${NC}"
        echo "$OLD_BACKUPS" | while read file; do
            echo "   - $(basename "$file")"
            rm "$file"
        done
        echo ""
    else
        echo -e "${BLUE}ℹ️  ${CLEANUP_DAYS}일 이상 된 백업 파일 없음${NC}"
        echo ""
    fi
fi

echo -e "${BLUE}💡 백업 복원 방법:${NC}"
echo "   ./scripts/restore_db.sh ${BACKUP_NAME}.tar.gz"
echo ""
