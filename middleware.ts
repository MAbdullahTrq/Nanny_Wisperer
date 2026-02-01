import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }
  if (record.count >= RATE_LIMIT.maxRequests) return false;
  record.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/api/')) {
    const key = getRateLimitKey(request);
    if (!checkRateLimit(key)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'fallback-dev-secret-change-in-production',
  });

  const isHostRoute = path.startsWith('/host');
  const isNannyRoute = path.startsWith('/nanny');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/auth');
  const isTokenized =
    path.startsWith('/shortlist/') || path.startsWith('/cv/') || path.startsWith('/interview/') || path.startsWith('/chat/');
  const isPublic = path === '/' || path.startsWith('/forgot-password') || path.startsWith('/reset-password') || path.startsWith('/demo-ui');

  if (isHostRoute || isNannyRoute) {
    if (!token) {
      const login = new URL('/login', request.url);
      login.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(login);
    }
    const userType = (token.userType as string) || '';
    if (isHostRoute && userType !== 'Host') {
      return NextResponse.redirect(new URL('/nanny/dashboard', request.url));
    }
    if (isNannyRoute && userType !== 'Nanny') {
      return NextResponse.redirect(new URL('/host/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/host/:path*',
    '/nanny/:path*',
    '/login',
    '/signup/:path*',
    '/auth/:path*',
    '/shortlist/:path*',
    '/cv/:path*',
    '/interview/:path*',
    '/chat/:path*',
    '/forgot-password',
    '/reset-password',
  ],
};
