import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/products';
import { getRateLimit, getClientIp } from '@/lib/rateLimit';

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const { isLimited, remaining } = getRateLimit(clientIp);

  if (isLimited) {
    const response = NextResponse.json(
      { error: 'Rate limit exceeded. Max 100 requests per minute.' },
      { status: 429 }
    );
    response.headers.set('Retry-After', '60');
    return addCorsHeaders(response);
  }

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || undefined;

  const subCategories = productService.getSubCategories(category);
  const response = NextResponse.json({ subCategories });
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return addCorsHeaders(response);
}

export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 204 });
  return addCorsHeaders(response);
}