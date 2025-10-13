import { NextRequest } from 'next/server';

const API_URL_INTERNAL = process.env.API_URL_INTERNAL || 'http://backend:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params;
  const authToken = request.headers.get('authorization');

  const response = await fetch(`${API_URL_INTERNAL}/api/scraper/get-mapping/${collectionId}`, {
    method: 'GET',
    headers: {
      Authorization: authToken || '',
    },
  });

  if (!response.ok) {
    return new Response(await response.text(), {
      status: response.status,
    });
  }

  const data = await response.json();
  return Response.json(data);
}
