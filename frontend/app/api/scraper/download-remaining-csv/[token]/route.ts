import { NextRequest } from 'next/server';

const API_URL_INTERNAL = process.env.API_URL_INTERNAL || 'http://backend:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const authToken = request.headers.get('authorization');

  const response = await fetch(`${API_URL_INTERNAL}/api/scraper/download-remaining-csv/${token}`, {
    method: 'GET',
    headers: {
      Authorization: authToken || '',
    },
  });

  if (!response.ok) {
    return new Response('다운로드 토큰이 유효하지 않거나 만료되었습니다.', {
      status: response.status,
    });
  }

  // CSV 응답을 그대로 전달
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="remaining_urls.csv"',
    },
  });
}
