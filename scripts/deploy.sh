#!/bin/bash

# myStorage EC2 배포 스크립트
#
# 사용법:
#   ./scripts/deploy.sh [options]
#
# 옵션:
#   --skip-env      .env 파일 설정 건너뛰기
#   --skip-backup   백업 건너뛰기
#   --skip-build    Docker 이미지 빌드 건너뛰기
#   -h, --help      도움말 표시

set -e  # 에러 발생 시 스크립트 중단

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 옵션 파싱
SKIP_ENV=false
SKIP_BACKUP=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-env)
            SKIP_ENV=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            echo "myStorage EC2 배포 스크립트"
            echo ""
            echo "사용법:"
            echo "  ./scripts/deploy.sh [options]"
            echo ""
            echo "옵션:"
            echo "  --skip-env      .env 파일 설정 건너뛰기"
            echo "  --skip-backup   백업 건너뛰기"
            echo "  --skip-build    Docker 이미지 빌드 건너뛰기"
            echo "  -h, --help      도움말 표시"
            exit 0
            ;;
        *)
            echo -e "${RED}알 수 없는 옵션: $1${NC}"
            exit 1
            ;;
    esac
done

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 헤더 출력
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}              ${GREEN}myStorage EC2 배포 스크립트${NC}                   ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 프로젝트 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

log_info "프로젝트 루트: $PROJECT_ROOT"
echo ""

# 1. 환경 설정 확인
log_info "📋 Step 1: 환경 설정 확인"

if [ "$SKIP_ENV" = false ]; then
    if [ ! -f ".env" ]; then
        log_warning ".env 파일이 없습니다. .env.example을 복사합니다."
        cp .env.example .env
        log_error ".env 파일을 편집하여 필수 환경 변수를 설정해주세요!"
        echo ""
        echo "필수 설정:"
        echo "  - POSTGRES_USER, POSTGRES_PASSWORD"
        echo "  - MONGO_USER, MONGO_PASSWORD"
        echo "  - SECRET_KEY (python -c \"import secrets; print(secrets.token_urlsafe(32))\" 로 생성)"
        echo "  - OWNER_EMAIL, OWNER_NAME"
        echo "  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
        echo "  - NEXT_PUBLIC_API_URL (EC2 퍼블릭 URL로 변경)"
        echo ""
        exit 1
    else
        log_success ".env 파일이 존재합니다."

        # 필수 환경 변수 확인
        source .env
        REQUIRED_VARS=(
            "POSTGRES_USER"
            "POSTGRES_PASSWORD"
            "MONGO_USER"
            "MONGO_PASSWORD"
            "SECRET_KEY"
            "OWNER_EMAIL"
            "GOOGLE_CLIENT_ID"
            "GOOGLE_CLIENT_SECRET"
        )

        MISSING_VARS=()
        for VAR in "${REQUIRED_VARS[@]}"; do
            if [ -z "${!VAR}" ] || [ "${!VAR}" == "todo_username" ] || [ "${!VAR}" == "todo_password" ] || [[ "${!VAR}" == *"your-"* ]] || [[ "${!VAR}" == *"change-this"* ]]; then
                MISSING_VARS+=("$VAR")
            fi
        done

        if [ ${#MISSING_VARS[@]} -ne 0 ]; then
            log_error "다음 환경 변수를 설정해주세요:"
            for VAR in "${MISSING_VARS[@]}"; do
                echo "  - $VAR"
            done
            echo ""
            exit 1
        fi

        log_success "필수 환경 변수가 모두 설정되었습니다."
    fi
else
    log_warning ".env 파일 설정을 건너뜁니다."
fi

echo ""

# 2. Docker 설치 확인
log_info "🐳 Step 2: Docker 설치 확인"

if ! command -v docker &> /dev/null; then
    log_error "Docker가 설치되어 있지 않습니다!"
    echo ""
    echo "Docker 설치 방법:"
    echo ""
    echo "Ubuntu:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    echo "  sudo usermod -aG docker \$USER"
    echo ""
    echo "Amazon Linux 2023:"
    echo "  sudo yum update -y"
    echo "  sudo yum install -y docker"
    echo "  sudo systemctl start docker"
    echo "  sudo systemctl enable docker"
    echo "  sudo usermod -aG docker \$USER"
    echo ""
    echo "설치 후 재로그인 필요!"
    echo ""
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose가 설치되어 있지 않습니다!"
    echo ""
    echo "Docker Compose 설치 방법:"
    echo ""
    echo "Ubuntu (Docker Compose V2 플러그인):"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y docker-compose-plugin"
    echo ""
    echo "Amazon Linux 2023 (standalone binary):"
    echo "  sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "  sudo chmod +x /usr/local/bin/docker-compose"
    echo ""
    exit 1
fi

log_success "Docker가 설치되어 있습니다."
docker --version
docker-compose --version 2>/dev/null || docker compose version

# Docker 자동완성 설정
log_info "Docker 자동완성 설정 확인..."

SHELL_RC=""
if [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
elif [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
fi

if [ -n "$SHELL_RC" ]; then
    COMPLETION_INSTALLED=false

    # Docker CLI 자동완성 확인
    if ! grep -q "docker completion" "$SHELL_RC" 2>/dev/null; then
        log_info "Docker CLI 자동완성을 설정합니다..."

        if [ -n "$BASH_VERSION" ]; then
            # Bash completion
            echo "" >> "$SHELL_RC"
            echo "# Docker CLI completion" >> "$SHELL_RC"
            echo 'if command -v docker &> /dev/null; then' >> "$SHELL_RC"
            echo '    complete -C "/usr/bin/docker" docker' >> "$SHELL_RC"
            echo 'fi' >> "$SHELL_RC"
        elif [ -n "$ZSH_VERSION" ]; then
            # Zsh completion
            echo "" >> "$SHELL_RC"
            echo "# Docker CLI completion" >> "$SHELL_RC"
            echo 'if command -v docker &> /dev/null; then' >> "$SHELL_RC"
            echo '    autoload -Uz compinit && compinit' >> "$SHELL_RC"
            echo '    [ -f /usr/share/zsh/site-functions/_docker ] && source /usr/share/zsh/site-functions/_docker' >> "$SHELL_RC"
            echo 'fi' >> "$SHELL_RC"
        fi
        COMPLETION_INSTALLED=true
    fi

    # Docker Compose 자동완성 확인
    if ! grep -q "docker-compose completion" "$SHELL_RC" 2>/dev/null && ! grep -q "docker compose completion" "$SHELL_RC" 2>/dev/null; then
        log_info "Docker Compose 자동완성을 설정합니다..."

        if [ -n "$BASH_VERSION" ]; then
            # Bash completion for docker-compose
            echo "" >> "$SHELL_RC"
            echo "# Docker Compose completion" >> "$SHELL_RC"
            echo 'if command -v docker-compose &> /dev/null; then' >> "$SHELL_RC"
            echo '    complete -C "/usr/bin/docker-compose" docker-compose' >> "$SHELL_RC"
            echo 'fi' >> "$SHELL_RC"
        elif [ -n "$ZSH_VERSION" ]; then
            # Zsh completion for docker-compose
            echo "" >> "$SHELL_RC"
            echo "# Docker Compose completion" >> "$SHELL_RC"
            echo 'if command -v docker-compose &> /dev/null; then' >> "$SHELL_RC"
            echo '    [ -f /usr/share/zsh/site-functions/_docker-compose ] && source /usr/share/zsh/site-functions/_docker-compose' >> "$SHELL_RC"
            echo 'fi' >> "$SHELL_RC"
        fi
        COMPLETION_INSTALLED=true
    fi

    if [ "$COMPLETION_INSTALLED" = true ]; then
        log_success "Docker 자동완성이 설정되었습니다."
        log_warning "자동완성을 활성화하려면 다음 명령어를 실행하거나 재로그인하세요:"
        echo "  source $SHELL_RC"
    else
        log_success "Docker 자동완성이 이미 설정되어 있습니다."
    fi
else
    log_warning "지원하지 않는 셸입니다. Bash 또는 Zsh를 사용하세요."
fi

echo ""

# 3. 기존 데이터 백업
log_info "💾 Step 3: 데이터 백업"

if [ "$SKIP_BACKUP" = false ]; then
    if docker-compose ps | grep -q "Up"; then
        log_info "기존 데이터를 백업합니다..."
        if [ -f "scripts/backup_db.sh" ]; then
            bash scripts/backup_db.sh --cleanup --cleanup-days 30
            log_success "백업이 완료되었습니다."
        else
            log_warning "백업 스크립트를 찾을 수 없습니다. 백업을 건너뜁니다."
        fi
    else
        log_warning "실행 중인 서비스가 없습니다. 백업을 건너뜁니다."
    fi
else
    log_warning "백업을 건너뜁니다."
fi

echo ""

# 4. 기존 컨테이너 중지
log_info "🛑 Step 4: 기존 컨테이너 중지"

if docker-compose ps | grep -q "Up"; then
    log_info "기존 컨테이너를 중지합니다..."
    docker-compose down
    log_success "컨테이너가 중지되었습니다."
else
    log_info "실행 중인 컨테이너가 없습니다."
fi

echo ""

# 5. Docker 이미지 빌드
log_info "🏗️  Step 5: Docker 이미지 빌드"

if [ "$SKIP_BUILD" = false ]; then
    log_info "Docker 이미지를 빌드합니다... (시간이 다소 걸릴 수 있습니다)"
    docker-compose build --no-cache
    log_success "이미지 빌드가 완료되었습니다."
else
    log_warning "이미지 빌드를 건너뜁니다."
fi

echo ""

# 6. 컨테이너 시작
log_info "🚀 Step 6: 컨테이너 시작"

log_info "Docker Compose로 서비스를 시작합니다..."
docker-compose up -d

log_info "컨테이너가 정상적으로 시작될 때까지 대기 중..."
sleep 10

echo ""

# 7. 헬스 체크
log_info "🏥 Step 7: 헬스 체크"

log_info "PostgreSQL 상태 확인..."
if docker-compose exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; then
    log_success "PostgreSQL이 정상 작동 중입니다."
else
    log_error "PostgreSQL 연결에 실패했습니다!"
    docker-compose logs postgres
    exit 1
fi

log_info "MongoDB 상태 확인..."
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    log_success "MongoDB가 정상 작동 중입니다."
else
    log_error "MongoDB 연결에 실패했습니다!"
    docker-compose logs mongodb
    exit 1
fi

log_info "Backend API 상태 확인..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:8000/api/collections > /dev/null 2>&1; then
        log_success "Backend API가 정상 작동 중입니다."
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo -n "."
        sleep 2
    else
        echo ""
        log_error "Backend API가 응답하지 않습니다!"
        docker-compose logs backend
        exit 1
    fi
done

log_info "Frontend 상태 확인..."
sleep 5
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend가 정상 작동 중입니다."
else
    log_warning "Frontend 확인에 실패했습니다. 로그를 확인하세요."
    docker-compose logs frontend | tail -20
fi

echo ""

# 8. 완료 메시지
log_success "✅ 배포가 완료되었습니다!"
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}                      ${GREEN}서비스 정보${NC}                            ${BLUE}║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC}  Frontend:    ${YELLOW}http://localhost:3000${NC}                        ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}  Backend API: ${YELLOW}http://localhost:8000${NC}                        ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}  API Docs:    ${YELLOW}http://localhost:8000/docs${NC}                   ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}주의사항:${NC}"
echo "  - EC2의 경우, 보안 그룹에서 포트 3000, 8000을 허용해야 합니다."
echo "  - .env의 NEXT_PUBLIC_API_URL을 EC2 퍼블릭 IP/도메인으로 변경하세요."
echo ""
echo -e "${BLUE}유용한 명령어:${NC}"
echo "  - 로그 확인: docker-compose logs -f [service]"
echo "  - 재시작: docker-compose restart"
echo "  - 중지: docker-compose down"
echo "  - 백업: bash scripts/backup_db.sh"
echo ""
