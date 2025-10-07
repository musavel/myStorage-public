import { NextRequest, NextResponse } from 'next/server';

const API_URL_INTERNAL = process.env.API_URL_INTERNAL || 'http://backend:8000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const collectionId = searchParams.get('collection_id');

  if (!collectionId) {
    return NextResponse.json({ error: 'collection_id is required' }, { status: 400 });
  }

  const response = await fetch(`${API_URL_INTERNAL}/api/items?collection_id=${collectionId}`, {
    cache: 'no-store',
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
