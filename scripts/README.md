# Scripts

유틸리티 스크립트 모음

---

## 📦 백업 및 복원

### backup_db.sh

PostgreSQL과 MongoDB 데이터를 백업합니다.

#### 사용법

```bash
# 기본 백업 (오래된 파일 삭제 안 함)
./scripts/backup_db.sh

# 백업 + 7일 이상 된 백업 삭제
./scripts/backup_db.sh --cleanup

# 백업 + 30일 이상 된 백업 삭제
./scripts/backup_db.sh --cleanup --cleanup-days 30

# 도움말
./scripts/backup_db.sh --help
```

#### 옵션

- `--cleanup`: 백업 후 오래된 백업 파일 자동 삭제
- `--cleanup-days N`: N일 이상 된 백업 삭제 (기본값: 7일, `--cleanup` 필요)
- `-h, --help`: 도움말 표시

#### 기능

- PostgreSQL 전체 DB를 SQL 파일로 백업
- MongoDB 전체 DB를 BSON 파일로 백업
- 타임스탬프가 포함된 파일명으로 저장 (`backup_YYYYMMDD_HHMMSS.tar.gz`)
- 자동 압축 (tar.gz)
- 옵션으로 오래된 백업 파일 정리 가능

#### 백업 위치

```
data/backups/backup_YYYYMMDD_HHMMSS.tar.gz
```

### restore_db.sh

백업된 데이터를 복원합니다.

#### 사용법

```bash
./scripts/restore_db.sh <backup_file.tar.gz>

# 예시
./scripts/restore_db.sh backup_20251010_153045.tar.gz
```

#### 주의사항

- ⚠️ **기존 데이터가 모두 삭제됩니다!**
- 복원 전 확인 메시지가 표시됩니다 (`yes` 입력 필요)
- 복원 후 백엔드 서비스 재시작 권장

---

## update_series.py

제목 키워드로 필터링하여 시리즈를 일괄 업데이트하는 스크립트 (click CLI)

### 필수 패키지

```bash
pip install click
```

### 사용법

#### 기본 사용법

```bash
# 미리보기 (DRY RUN)
python scripts/update_series.py -c <컬렉션명> -k <키워드> -s <시리즈명>

# 실제 업데이트
python scripts/update_series.py -c <컬렉션명> -k <키워드> -s <시리즈명> --execute
```

#### 옵션

- `-c, --collection`: 컬렉션 이름 (slug) [필수]
- `-k, --keyword`: 제목에 포함되어야 할 키워드 [필수]
- `-s, --series`: 설정할 시리즈명 [필수]
- `--execute`: 실제로 업데이트 실행 (없으면 미리보기만)

#### 도움말

```bash
python scripts/update_series.py --help
```

### 예시

#### 예시 1: "원피스" 시리즈 설정 (미리보기)

```bash
python scripts/update_series.py -c books -k "원피스" -s "원피스"
```

#### 예시 2: "원피스" 시리즈 설정 (실제 업데이트)

```bash
python scripts/update_series.py -c books -k "원피스" -s "원피스" --execute
```

#### 예시 3: "나의 히어로 아카데미아" 시리즈 설정

```bash
# 미리보기
python scripts/update_series.py -c books -k "나의 히어로 아카데미아" -s "나의 히어로 아카데미아"

# 실제 업데이트
python scripts/update_series.py -c books -k "나의 히어로 아카데미아" -s "나의 히어로 아카데미아" --execute
```

#### 예시 4: "SPY×FAMILY" 시리즈 설정 (키워드와 시리즈명이 다른 경우)

```bash
# "스파이 패밀리"로 검색하고, 시리즈는 "SPY×FAMILY"로 설정
python scripts/update_series.py -c books -k "스파이 패밀리" -s "SPY×FAMILY" --execute
```

#### 예시 5: 여러 시리즈 일괄 업데이트 (쉘 스크립트)

여러 시리즈를 한 번에 업데이트하려면 쉘 스크립트를 작성할 수 있습니다:

```bash
#!/bin/bash

# update_all_series.sh

python scripts/update_series.py -c books -k "원피스" -s "원피스" --execute
python scripts/update_series.py -c books -k "귀멸의 칼날" -s "귀멸의 칼날" --execute
python scripts/update_series.py -c books -k "나의 히어로 아카데미아" -s "나의 히어로 아카데미아" --execute
```

### 주의사항

- **항상 미리보기 먼저**: `--execute` 없이 먼저 실행하여 결과를 확인
- **키워드는 대소문자 구분 없음**: "원피스", "ONEPIECE", "Onepiece" 모두 매칭
- **부분 일치**: 제목에 키워드가 포함되기만 하면 매칭 (예: "원피스 1권", "ONE PIECE 완전판" 등)
- **MongoDB 연결 필요**: `.env` 파일에 `MONGO_URL`이 설정되어 있어야 함

### 출력 예시

#### 미리보기 모드

```
╔════════════════════════════════════════════════════════════════╗
║                   시리즈 수동 업데이트 스크립트                  ║
╚════════════════════════════════════════════════════════════════╝

📚 컬렉션: Books (ID: 1)
🔍 키워드: '원피스'
📖 시리즈명: '원피스'
================================================================================

✅ 15개의 아이템을 찾았습니다:

1. 원피스 1권
   현재 시리즈: (없음) → 변경될 시리즈: '원피스'

2. 원피스 2권
   현재 시리즈: (없음) → 변경될 시리즈: '원피스'

...

================================================================================
🔍 DRY RUN 모드: 실제로 업데이트되지 않았습니다.
실제로 업데이트하려면 --execute 플래그를 사용하세요.
```

#### 실제 업데이트 모드

```
╔════════════════════════════════════════════════════════════════╗
║                   시리즈 수동 업데이트 스크립트                  ║
╚════════════════════════════════════════════════════════════════╝

📚 컬렉션: Books (ID: 1)
🔍 키워드: '원피스'
📖 시리즈명: '원피스'
================================================================================

✅ 15개의 아이템을 찾았습니다:

1. 원피스 1권
   현재 시리즈: (없음) → 변경될 시리즈: '원피스'

2. 원피스 2권
   현재 시리즈: (없음) → 변경될 시리즈: '원피스'

...

================================================================================
⚙️  업데이트를 시작합니다...

✅ 업데이트 완료: 원피스 1권
✅ 업데이트 완료: 원피스 2권
...

================================================================================
🎉 완료! 15/15개 아이템이 업데이트되었습니다.
```

## 🚀 배포

### deploy.sh

EC2 또는 서버에 myStorage를 빠르게 배포하는 스크립트입니다.

#### 사용법

```bash
# 기본 배포 (전체 과정 실행)
./scripts/deploy.sh

# 특정 단계 건너뛰기
./scripts/deploy.sh --skip-env      # .env 설정 건너뛰기
./scripts/deploy.sh --skip-backup   # 백업 건너뛰기
./scripts/deploy.sh --skip-build    # 이미지 빌드 건너뛰기

# 여러 옵션 조합
./scripts/deploy.sh --skip-env --skip-backup

# 도움말
./scripts/deploy.sh --help
```

#### 옵션

- `--skip-env`: .env 파일 설정 확인을 건너뜁니다
- `--skip-backup`: 기존 데이터 백업을 건너뜁니다
- `--skip-build`: Docker 이미지 빌드를 건너뜁니다 (기존 이미지 사용)
- `-h, --help`: 도움말을 표시합니다

#### 배포 프로세스

1. **환경 설정 확인**
   - `.env` 파일 존재 확인
   - 필수 환경 변수 검증
   - 기본값 또는 누락된 값 감지

2. **Docker 설치 확인**
   - Docker 및 Docker Compose 설치 여부 확인
   - 버전 정보 출력
   - Docker CLI 및 Docker Compose 자동완성 설정 (Bash/Zsh)

3. **데이터 백업**
   - 기존 컨테이너가 실행 중인 경우 백업
   - 30일 이상 된 백업 파일 자동 정리

4. **기존 컨테이너 중지**
   - `docker-compose down`으로 모든 서비스 중지

5. **Docker 이미지 빌드**
   - 최신 코드로 이미지 재빌드 (`--no-cache`)

6. **컨테이너 시작**
   - `docker-compose up -d`로 모든 서비스 시작
   - 데이터베이스가 준비될 때까지 대기

7. **헬스 체크**
   - PostgreSQL 연결 확인
   - MongoDB 연결 확인
   - Backend API 응답 확인 (최대 60초 대기)
   - Frontend 응답 확인

8. **완료 메시지**
   - 서비스 URL 안내
   - EC2 설정 주의사항
   - 유용한 Docker 명령어 안내

#### EC2 배포 시 사전 준비

##### 1. EC2 인스턴스 생성

- **권장 스펙**: t3.medium 이상 (2 vCPU, 4GB RAM)
- **운영체제**: Ubuntu 22.04 LTS 또는 Amazon Linux 2023
- **스토리지**: 최소 20GB (데이터 규모에 따라 조정)

##### 2. 보안 그룹 설정

EC2 보안 그룹에서 다음 포트를 허용해야 합니다:

| 포트 | 프로토콜 | 설명 | 소스 |
|------|---------|------|------|
| 22 | TCP | SSH | 내 IP |
| 80 | TCP | HTTP (선택) | 0.0.0.0/0 |
| 443 | TCP | HTTPS (선택) | 0.0.0.0/0 |
| 3000 | TCP | Frontend | 0.0.0.0/0 |
| 8000 | TCP | Backend API | 0.0.0.0/0 |

##### 3. Docker 설치 (Ubuntu)

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 재로그인 (필수!)
exit
# SSH 재접속

# Docker Compose 설치 (V2)
sudo apt-get update
sudo apt-get install docker-compose-plugin

# (선택) Bash completion 패키지 설치
sudo apt-get install -y bash-completion
```

##### 4. Docker 설치 (Amazon Linux 2023)

```bash
# Docker 설치
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# 재로그인 (필수!)
exit
# SSH 재접속

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# (선택) Bash completion 패키지 설치
sudo yum install -y bash-completion
```

##### 5. 프로젝트 클론

```bash
# Git 설치 (필요시)
sudo apt-get install -y git  # Ubuntu
sudo yum install -y git      # Amazon Linux

# 프로젝트 클론
git clone https://github.com/your-username/myStorage.git
cd myStorage
```

##### 6. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env  # 또는 vim .env
```

**필수 설정 항목:**

```bash
# PostgreSQL
POSTGRES_USER=mystorage_user
POSTGRES_PASSWORD=강력한_비밀번호_생성
POSTGRES_DB=mystorage

# MongoDB
MONGO_USER=mystorage_admin
MONGO_PASSWORD=강력한_비밀번호_생성
MONGO_DB=mystorage

# 인증
SECRET_KEY=   # python3 -c "import secrets; print(secrets.token_urlsafe(32))" 로 생성
OWNER_EMAIL=your-email@gmail.com
OWNER_NAME=Your Name
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend (EC2 퍼블릭 IP 또는 도메인으로 변경!)
NEXT_PUBLIC_API_URL=http://YOUR_EC2_PUBLIC_IP:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_OWNER_NAME=Your Name
```

**EC2 퍼블릭 IP 확인:**
```bash
curl http://checkip.amazonaws.com
```

##### 7. 배포 실행

```bash
# 전체 배포 (Docker 자동완성 포함)
./scripts/deploy.sh
```

배포 스크립트는 자동으로 Docker 및 Docker Compose의 자동완성을 설정합니다:
- **Bash**: `~/.bashrc`에 자동완성 설정 추가
- **Zsh**: `~/.zshrc`에 자동완성 설정 추가

자동완성 즉시 활성화:
```bash
# Bash 사용자
source ~/.bashrc

# Zsh 사용자
source ~/.zshrc
```

#### 배포 후 확인

```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f mongodb

# API 응답 확인
curl http://localhost:8000/api/collections

# Frontend 접속
# 브라우저에서 http://YOUR_EC2_PUBLIC_IP:3000
```

#### 트러블슈팅

##### 문제 1: 포트가 이미 사용 중

```bash
# 포트 사용 프로세스 확인
sudo lsof -i :3000
sudo lsof -i :8000

# 프로세스 종료
sudo kill -9 <PID>
```

##### 문제 2: Docker 권한 오류

```bash
# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 재로그인 필요!
exit
```

##### 문제 3: 메모리 부족

```bash
# 스왑 메모리 생성 (t2.micro 등 저사양 인스턴스)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

##### 문제 4: Backend API 응답 없음

```bash
# Backend 로그 확인
docker-compose logs backend

# 데이터베이스 연결 확인
docker-compose exec backend env | grep POSTGRES
docker-compose exec backend env | grep MONGO

# 컨테이너 재시작
docker-compose restart backend
```

#### 프로덕션 권장 설정

##### 1. 리버스 프록시 (Nginx)

```nginx
# /etc/nginx/sites-available/mystorage
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

##### 2. SSL/TLS (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com
```

##### 3. 자동 백업 (Cron)

```bash
# 매일 새벽 3시 자동 백업
crontab -e

# 다음 줄 추가
0 3 * * * cd /path/to/myStorage && bash scripts/backup_db.sh --cleanup --cleanup-days 30
```

##### 4. 로그 로테이션

```bash
# /etc/logrotate.d/mystorage
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    missingok
    delaycompress
    copytruncate
}
```

#### 업데이트 배포

```bash
# 최신 코드 가져오기
git pull origin main

# 백업 생성 후 재배포 (이미지 재빌드)
./scripts/deploy.sh

# 또는 빠른 재시작 (코드 변경만 있는 경우)
docker-compose restart backend frontend
```

#### 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [AWS EC2 사용 설명서](https://docs.aws.amazon.com/ec2/)
- [Nginx 공식 문서](https://nginx.org/en/docs/)

---

## test_scraper.py

웹 스크래퍼 테스트 스크립트 - 교보문고/알라딘 스크래핑 테스트용
