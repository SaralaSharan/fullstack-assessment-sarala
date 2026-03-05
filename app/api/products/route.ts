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

  const rawLimit = searchParams.get('limit');
  const rawOffset = searchParams.get('offset');

  let limit = rawLimit ? parseInt(rawLimit, 10) : 20;
  let offset = rawOffset ? parseInt(rawOffset, 10) : 0;

  if (isNaN(limit) || limit < 0 || limit > 100) {
    limit = 20;
  }
  if (isNaN(offset) || offset < 0 || offset > 100000) {
    offset = 0;
  }

  const filters = {
    category: searchParams.get('category') || undefined,
    subCategory: searchParams.get('subCategory') || undefined,
    search: searchParams.get('search') || undefined,
    limit,
    offset,
  };

  const products = productService.getAll(filters);
  const total = productService.getTotalCount({
    category: filters.category,
    subCategory: filters.subCategory,
    search: filters.search,
  });

  const response = NextResponse.json({
    products,
    total,
    limit: filters.limit,
    offset: filters.offset,
  });
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return addCorsHeaders(response);
}

export async function OPTIONS() {
  // handle CORS preflight requests
  const response = NextResponse.json({}, { status: 204 });
  return addCorsHeaders(response);
}
