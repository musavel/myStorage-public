// 서버 사이드에서는 Docker 네트워크 내부 주소 사용
// 클라이언트 사이드에서는 브라우저에서 접근 가능한 주소 사용
const API_URL = typeof window === 'undefined'
  ? process.env.API_URL_INTERNAL || 'http://backend:8000'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
