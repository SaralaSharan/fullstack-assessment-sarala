// Simple in-memory rate limiter for API endpoints
// Tracks requests per IP address to prevent abuse

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute per IP

export function getRateLimit(ip: string): { isLimited: boolean; remaining: number } {
  const now = Date.now();
  let record = requestCounts.get(ip);

  // clean up old records
  if (record && now > record.resetTime) {
    record = undefined;
  }

  if (!record) {
    // new rate limit window
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { isLimited: false, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  record.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - record.count);

  return {
    isLimited: record.count > MAX_REQUESTS_PER_WINDOW,
    remaining,
  };
}

export function getClientIp(request: Request): string {
  // in production, use x-forwarded-for from load balancer or CF-Connecting-IP
  const forwarded = request.headers.get('x-forwarded-for');
  const cfIp = request.headers.get('cf-connecting-ip');
  const realIp = request.headers.get('x-real-ip');

  return forwarded?.split(',')[0].trim() || cfIp || realIp || 'unknown';
}
