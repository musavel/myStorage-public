import { NextRequest } from 'next/server';

const API_URL_INTERNAL = process.env.API_URL_INTERNAL || 'http://backend:8000';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = request.headers.get('authorization');

  const response = await fetch(`${API_URL_INTERNAL}/api/scraper/bulk-scrape-csv-stream`, {
    method: 'POST',
    headers: {
      Authorization: token || '',
    },
    body: formData,
  });

  // 스트리밍 응답을 그대로 전달
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
