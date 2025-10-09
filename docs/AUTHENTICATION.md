# 인증 시스템

## 개요

myStorage는 Google OAuth 2.0 기반의 인증 시스템을 사용합니다. 소유자만 관리 기능에 접근할 수 있으며, 모든 조회 기능은 인증 없이 접근 가능합니다.

## 인증 흐름

### 1. 프론트엔드 로그인

```
사용자 → Google OAuth → 프론트엔드 → 백엔드 → JWT 토큰 발급
```

#### 단계:
1. 사용자가 `/admin`에서 "Google 로그인" 버튼 클릭
2. `@react-oauth/google` 라이브러리가 Google OAuth 처리
3. Google에서 `credential` (JWT 토큰) 반환
4. 프론트엔드가 `/api/auth/google` POST 요청
   ```json
   {
     "token": "google_credential_jwt"
   }
   ```
5. 백엔드가 Google 토큰 검증 후 자체 JWT 발급
6. 프론트엔드가 토큰을 `localStorage`에 저장
   - Key: `auth_token`
   - Value: JWT 토큰

### 2. 백엔드 인증 검증

모든 관리 API는 `require_owner` 의존성을 사용하여 인증을 검증합니다.

#### 보호된 API 목록:

**컬렉션 API** (`/api/collections`)
- ✅ `GET /` - Public (인증 불필요)
- ✅ `GET /{id}` - Public (인증 불필요)
- 🔒 `POST /` - Owner only (인증 필요)
- 🔒 `PUT /{id}` - Owner only (인증 필요)
- 🔒 `DELETE /{id}` - Owner only (인증 필요)

**아이템 API** (`/api/items`)
- ✅ `GET /` - Public (인증 불필요)
- ✅ `GET /{collection_id}/{item_id}` - Public (인증 불필요)
- 🔒 `POST /` - Owner only (인증 필요)
- 🔒 `PUT /{collection_id}/{item_id}` - Owner only (인증 필요)
- 🔒 `DELETE /{collection_id}/{item_id}` - Owner only (인증 필요)

**AI API** (`/api/ai`)
- 🔒 `POST /suggest-fields` - Owner only (인증 필요)
- 🔒 `POST /set-models` - Owner only (인증 필요)
- ✅ `GET /models` - Public (인증 불필요)
- ✅ `GET /providers` - Public (인증 불필요)
- ✅ `GET /get-models` - Public (인증 불필요)

### 3. 토큰 전달 방식

프론트엔드에서 백엔드로 토큰을 전달하는 방법:

#### Next.js API Routes (SSR/프록시)
```typescript
// frontend/app/api/collections/route.ts
const authHeader = request.headers.get('authorization');

const response = await fetch(`${API_URL}/api/collections`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': authHeader,  // 클라이언트에서 받은 헤더 전달
  },
  body: JSON.stringify(body),
});
```

#### 클라이언트 사이드 (컴포넌트)
```typescript
const token = localStorage.getItem('auth_token');

const response = await fetch('/api/collections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,  // Bearer 스킴 사용
  },
  body: JSON.stringify(data),
});
```

## 보안 사항

### ✅ 적용된 보안
1. **백엔드 인증 검증**: 모든 관리 API에 `require_owner` 적용
2. **JWT 토큰**: 만료 시간이 있는 JWT 사용
3. **소유자 이메일 검증**: 환경 변수 `OWNER_EMAIL`과 일치하는 사용자만 허용
4. **HTTPS 필수**: 프로덕션에서는 HTTPS 사용 권장

### ⚠️ 주의사항
1. **프론트엔드는 신뢰할 수 없음**: 프론트엔드의 인증 체크는 UX를 위한 것이며, 실제 보안은 백엔드에서 처리
2. **토큰 저장**: `localStorage`는 XSS 공격에 취약할 수 있으므로, 프로덕션에서는 `httpOnly` 쿠키 사용 고려
3. **API 직접 호출**: 누구나 백엔드 API를 직접 호출할 수 있지만, 토큰이 없으면 401 Unauthorized 응답

### 🔐 인증 에러 처리

#### 401 Unauthorized
- **원인**: 토큰이 없거나 유효하지 않음
- **해결**:
  1. 로그아웃 후 다시 로그인
  2. `localStorage`에서 `auth_token` 확인
  3. 토큰이 만료되었을 수 있음

#### 403 Forbidden
- **원인**: 토큰은 유효하지만 소유자가 아님
- **해결**: `OWNER_EMAIL` 환경 변수와 로그인한 이메일이 일치하는지 확인

## 환경 변수

### 필수 설정

```bash
# 백엔드 (.env)
OWNER_EMAIL=your-email@gmail.com  # 소유자 이메일
SECRET_KEY=your-secret-key        # JWT 서명용 비밀키
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# 프론트엔드 (.env)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id  # 클라이언트 사이드 Google OAuth용
```

## 토큰 구조

### Google Credential (입력)
Google OAuth에서 받은 JWT 토큰

### 자체 JWT (출력)
```json
{
  "sub": "user-email@gmail.com",
  "exp": 1234567890,
  "name": "User Name"
}
```

- **sub**: 사용자 이메일 (소유자 이메일과 비교)
- **exp**: 만료 시간 (Unix timestamp)
- **name**: 사용자 이름

## 개발 시 주의사항

### localStorage 키 이름
- ❌ `authToken` (잘못됨)
- ✅ `auth_token` (올바름)

모든 코드에서 `auth_token`을 사용해야 합니다.

### Authorization 헤더 형식
```
Authorization: Bearer <token>
```

Bearer 스킴을 사용하며, 백엔드에서 `Bearer ` 접두사를 제거하고 토큰을 추출합니다.

## 테스트

### 인증 필요 API 테스트
```bash
# 1. 로그인하여 토큰 획득
curl -X POST http://localhost:8000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "google_credential"}'

# 2. 토큰으로 API 호출
curl -X POST http://localhost:8000/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Test", "slug": "test"}'
```

### 인증 없이 호출 시도 (실패 예상)
```bash
curl -X POST http://localhost:8000/api/collections \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "slug": "test"}'

# 결과: 401 Unauthorized
```
