import { NextRequest, NextResponse } from 'next/server';

const API_URL_INTERNAL = process.env.API_URL_INTERNAL || 'http://backend:8000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const collectionId = searchParams.get('collection_id');

  if (!collectionId) {
    return NextResponse.json({ error: 'collection_id is required' }, { status: 400 });
  }

  const authHeader = request.headers.get('authorization');

  // 모든 쿼리 파라미터를 백엔드로 전달
  const backendUrl = new URL(`${API_URL_INTERNAL}/api/items`);
  searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  const response = await fetch(backendUrl.toString(), {
    cache: 'no-store',
    headers: {
      ...(authHeader ? { 'Authorization': authHeader } : {}),
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization');
  const body = await request.json();

  const response = await fetch(`${API_URL_INTERNAL}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
