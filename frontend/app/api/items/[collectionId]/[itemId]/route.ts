import { NextRequest, NextResponse } from 'next/server';

const API_URL_INTERNAL = process.env.API_URL_INTERNAL || 'http://backend:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string; itemId: string }> }
) {
  const { collectionId, itemId } = await params;
  const response = await fetch(
    `${API_URL_INTERNAL}/api/items/${collectionId}/${itemId}`,
    { cache: 'no-store' }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string; itemId: string }> }
) {
  const { collectionId, itemId } = await params;
  const token = request.headers.get('authorization');
  const body = await request.json();

  const response = await fetch(
    `${API_URL_INTERNAL}/api/items/${collectionId}/${itemId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string; itemId: string }> }
) {
  const { collectionId, itemId } = await params;
  const token = request.headers.get('authorization');

  const response = await fetch(
    `${API_URL_INTERNAL}/api/items/${collectionId}/${itemId}`,
    {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: token } : {}),
      },
    }
  );

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
