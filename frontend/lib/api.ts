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
  created_at: string;
  updated_at?: string;
}

export interface Book {
  id: number;
  collection_id: number;
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  image_url?: string;
  published_date?: string;
  page_count?: number;
  category?: string;
  purchase_date?: string;
  purchase_price?: number;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface BoardGame {
  id: number;
  collection_id: number;
  title: string;
  designer?: string;
  publisher?: string;
  year_published?: number;
  description?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  min_playtime?: number;
  max_playtime?: number;
  min_age?: number;
  complexity?: string;
  category?: string;
  purchase_date?: string;
  purchase_price?: number;
  location?: string;
  expansion?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Collections
export async function getCollections(): Promise<Collection[]> {
  const res = await fetch(`${API_URL}/api/collections`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch collections');
  return res.json();
}

// Books
export async function getBooks(): Promise<Book[]> {
  const res = await fetch(`${API_URL}/api/books`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}

export async function getBook(id: number): Promise<Book> {
  const res = await fetch(`${API_URL}/api/books/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch book');
  return res.json();
}

// Board Games
export async function getBoardGames(): Promise<BoardGame[]> {
  const res = await fetch(`${API_URL}/api/board-games`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch board games');
  return res.json();
}

export async function getBoardGame(id: number): Promise<BoardGame> {
  const res = await fetch(`${API_URL}/api/board-games/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch board game');
  return res.json();
}

// Create/Update/Delete functions (require authentication)
export async function createBook(data: Partial<Book>): Promise<Book> {
  const res = await fetch(`${API_URL}/api/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create book');
  return res.json();
}

export async function updateBook(id: number, data: Partial<Book>): Promise<Book> {
  const res = await fetch(`${API_URL}/api/books/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update book');
  return res.json();
}

export async function deleteBook(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/books/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete book');
}

export async function createBoardGame(data: Partial<BoardGame>): Promise<BoardGame> {
  const res = await fetch(`${API_URL}/api/board-games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create board game');
  return res.json();
}

export async function updateBoardGame(id: number, data: Partial<BoardGame>): Promise<BoardGame> {
  const res = await fetch(`${API_URL}/api/board-games/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update board game');
  return res.json();
}

export async function deleteBoardGame(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/board-games/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete board game');
}
