# 페이지네이션 시스템

서버 사이드 페이지네이션으로 대용량 데이터 효율적 처리

---

## 개요

아이템 목록을 페이지 단위로 나눠서 표시하여 성능과 사용자 경험을 개선합니다.

### 특징
- 서버 사이드 페이지네이션 (MongoDB skip/limit)
- 한 페이지당 30개 아이템
- 검색/정렬과 통합
- 전체 페이지 수 표시
- 처음/이전/다음/마지막 페이지 버튼

---

## 기술 구조

### 백엔드 (FastAPI + MongoDB)

**스키마** (`backend/app/schemas/item.py`):
```python
class PaginatedItemsResponse(BaseModel):
    """페이지네이션된 아이템 목록 응답"""
    items: List[ItemResponse]
    total: int                # 전체 아이템 수
    page: int                 # 현재 페이지
    page_size: int            # 페이지당 아이템 수
    total_pages: int          # 전체 페이지 수
```

**서비스 로직** (`backend/app/services/item/item_service.py`):
```python
async def get_all_items(
    collection_id: int,
    db: Session,
    is_owner: bool = False,
    page: int = 1,
    page_size: int = 30,
    search_query: Optional[str] = None,
    search_field: Optional[str] = None,
    sort_key: str = "created_at",
    sort_order: str = "desc"
) -> Dict[str, Any]:
    # 전체 개수 조회
    total = await mongo_db[collection].count_documents(query)

    # 페이지네이션 계산
    skip = (page - 1) * page_size
    total_pages = (total + page_size - 1) // page_size

    # 아이템 조회 (검색/정렬/페이지네이션)
    items = await mongo_db[collection].find(query) \
        .sort(sort_by) \
        .skip(skip) \
        .limit(page_size) \
        .to_list(page_size)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
```

**API 엔드포인트** (`backend/app/api/items.py`):
```python
@router.get("", response_model=PaginatedItemsResponse)
async def get_items_endpoint(
    collection_id: int,
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    page_size: int = Query(30, ge=1, le=100, description="페이지당 아이템 수"),
    search_query: str = Query(None),
    search_field: str = Query(None),
    sort_key: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    user_is_owner: bool = Depends(is_owner)
):
    return await get_all_items(...)
```

### 프론트엔드 (Next.js + React)

**API 타입** (`frontend/lib/api.ts`):
```typescript
export interface PaginatedItems {
  items: Item[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function getItems(
  collectionId: number,
  page: number = 1,
  pageSize: number = 30
): Promise<PaginatedItems> {
  const res = await fetch(
    `${API_URL}/api/items?collection_id=${collectionId}&page=${page}&page_size=${pageSize}`
  );
  return res.json();
}
```

**페이지 컴포넌트** (관리자/공개 페이지):
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalItems, setTotalItems] = useState(0);
const pageSize = 30;

// 페이지 변경 시 데이터 fetch
useEffect(() => {
  if (collection) {
    fetchItems();
  }
}, [collection, currentPage, searchQuery, sortKey]);

// API 호출
const fetchItems = async () => {
  const params = new URLSearchParams({
    collection_id: collection.id.toString(),
    page: currentPage.toString(),
    page_size: pageSize.toString(),
    sort_key: sortKey,
    sort_order: sortOrder,
  });

  if (searchQuery) {
    params.append('search_query', searchQuery);
    params.append('search_field', searchField);
  }

  const res = await fetch(`/api/items?${params.toString()}`);
  const data = await res.json();

  setItems(data.items);
  setTotalPages(data.total_pages);
  setTotalItems(data.total);
};
```

**UI 컴포넌트**:
```tsx
{/* 결과 건수 */}
<p>
  총 <span>{totalItems}</span>건
  <span>(현재 페이지: {items.length}건)</span>
</p>

{/* 페이지네이션 버튼 */}
{totalPages > 1 && (
  <div className="flex items-center gap-2">
    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
      처음
    </button>
    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
      이전
    </button>
    <span>{currentPage} / {totalPages}</span>
    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
      다음
    </button>
    <button onClick={() => setCurrentPage(totalPages)}>
      마지막
    </button>
  </div>
)}
```

---

## 주요 기능

### 1. 서버 사이드 페이지네이션
- MongoDB의 `skip()`, `limit()` 사용
- 클라이언트에 필요한 데이터만 전송
- 메모리 효율적

### 2. 검색/정렬과 통합
- 검색 시 검색 결과의 전체 개수 표시
- 검색/정렬 변경 시 자동으로 첫 페이지로 이동
- 페이지 전환 시에도 검색/정렬 상태 유지

### 3. 사용자 경험
- 현재 페이지와 전체 페이지 수 표시
- 처음/이전/다음/마지막 버튼으로 빠른 이동
- 첫 페이지/마지막 페이지에서 버튼 비활성화
- 현재 페이지 아이템 수 표시

---

## 성능 최적화

### MongoDB 인덱스
```javascript
// 페이지네이션 성능 향상을 위한 인덱스
db.items_cartoons.createIndex({"collection_id": 1, "created_at": -1})
db.items_cartoons.createIndex({"collection_id": 1, "metadata.title": 1})
```

### 쿼리 최적화
- `count_documents()`: 전체 개수만 빠르게 조회
- `skip() + limit()`: 필요한 페이지만 조회
- `sort()`: 인덱스 활용

### 캐싱 전략
- 페이지 전환 시 이전 페이지 데이터 유지 (뒤로가기 시 빠름)
- 검색/정렬 변경 시 캐시 초기화

---

## API 예시

### 기본 조회 (첫 페이지)
```bash
GET /api/items?collection_id=1&page=1&page_size=30
```

### 검색과 함께
```bash
GET /api/items?collection_id=1&page=1&page_size=30&search_query=해리포터&search_field=title
```

### 정렬과 함께
```bash
GET /api/items?collection_id=1&page=2&page_size=30&sort_key=created_at&sort_order=desc
```

### 응답 예시
```json
{
  "items": [
    {
      "_id": "...",
      "collection_id": 1,
      "metadata": {"title": "해리포터 1권"},
      "created_at": "2025-01-15T10:30:00Z"
    },
    // ... 29개 더
  ],
  "total": 1234,
  "page": 2,
  "page_size": 30,
  "total_pages": 42
}
```

---

## 제한사항

### 페이지 크기
- 최소: 1개
- 최대: 100개
- 기본값: 30개

### 대용량 데이터
- 10만 건 이상: 인덱스 필수
- 100만 건 이상: 커서 기반 페이지네이션 고려
- `skip()`은 큰 값에서 느려질 수 있음 (offset 한계)

---

## 향후 개선 방안

1. **커서 기반 페이지네이션**
   - `skip()` 대신 마지막 아이템 ID 사용
   - 매우 큰 offset에서도 빠름
   - 무한 스크롤에 적합

2. **캐싱**
   - Redis로 자주 조회되는 페이지 캐싱
   - 검색 결과 캐싱 (5분 TTL)

3. **가상 스크롤**
   - 클라이언트에서 수천 개 렌더링 최적화
   - react-window, react-virtualized

---

## 관련 문서

- [Changelog 2025-10-13](../changelog/2025-10-13.md)
- [컬렉션 시스템](./collections.md)
