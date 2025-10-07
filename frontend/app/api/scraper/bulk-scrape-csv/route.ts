import { NextRequest, NextResponse } from 'next/server';

const API_URL_INTERNAL = process.env.API_URL_INTERNAL || 'http://backend:8000';

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization');
  const formData = await request.formData();

  const response = await fetch(`${API_URL_INTERNAL}/api/scraper/bulk-scrape-csv`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: token } : {}),
    },
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
