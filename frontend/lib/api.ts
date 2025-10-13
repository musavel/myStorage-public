// 서버 사이드에서는 Docker 네트워크 내부 주소 사용
// 클라이언트 사이드에서는 브라우저에서 접근 가능한 주소 사용
const API_URL = typeof window === 'undefined'
  ? process.env.API_URL_INTERNAL || 'http://backend:8000'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 인증 헤더 생성 (클라이언트 사이드에서만)
function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('auth_token');
  if (!token) return {};

  return {
    'Authorization': `Bearer ${token}`,
  };
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  is_public: boolean;
  mongo_collection?: string;
  field_definitions?: any;
  created_at: string;
  updated_at?: string;
}

export interface Item {
  _id: string;
  collection_id: number;
  is_public: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedItems {
  items: Item[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Collections
export async function getCollections(): Promise<Collection[]> {
  const res = await fetch(`${API_URL}/api/collections`, { cache: 'no-store' }); // 백엔드에서 자동으로 공개 항목만 조회
  if (!res.ok) throw new Error('Failed to fetch collections');
  return res.json();
}

export async function getCollection(id: number): Promise<Collection> {
  const res = await fetch(`${API_URL}/api/collections/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch collection');
  return res.json();
}

export async function getCollectionBySlug(slug: string): Promise<Collection> {
  const collections = await getCollections();
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) throw new Error('Collection not found');
  return collection;
}

// Items
export async function getItems(collectionId: number, page: number = 1, pageSize: number = 30): Promise<PaginatedItems> {
  const res = await fetch(`${API_URL}/api/items?collection_id=${collectionId}&page=${page}&page_size=${pageSize}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export async function getItem(collectionId: number, itemId: string): Promise<Item> {
  const res = await fetch(`${API_URL}/api/items/${collectionId}/${itemId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch item');
  return res.json();
}

export async function createItem(collectionId: number, metadata: Record<string, any>): Promise<Item> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(`${API_URL}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ collection_id: collectionId, metadata }),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function updateItem(collectionId: number, itemId: string, metadata: Record<string, any>): Promise<Item> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(`${API_URL}/api/items/${collectionId}/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ metadata }),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}

export async function deleteItem(collectionId: number, itemId: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(`${API_URL}/api/items/${collectionId}/${itemId}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Failed to delete item');
}
