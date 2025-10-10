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

## test_scraper.py

웹 스크래퍼 테스트 스크립트 - 교보문고/알라딘 스크래핑 테스트용
