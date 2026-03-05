import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/** Normalize X-Forwarded-* to a single value each so Next.js does not return 400 behind Nginx. */
function normalizeForwardedHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor != null) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) headers.set('x-forwarded-for', first);
  }
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto != null) {
    const first = forwardedProto.split(',')[0]?.trim();
    if (first) headers.set('x-forwarded-proto', first);
  }
  return headers;
}

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
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
  const normalizedHeaders = normalizeForwardedHeaders(request);

  if (path.startsWith('/_next/static/')) {
    return NextResponse.next({ request: { headers: normalizedHeaders } });
  }

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
  const isAdminRoute = path.startsWith('/admin');
  const isMatchmakerRoute = path.startsWith('/matchmaker');
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/auth');
  const isTokenized =
    path.startsWith('/shortlist/') || path.startsWith('/cv/') || path.startsWith('/interview/') || path.startsWith('/chat/');
  const isPublic = path === '/' || path.startsWith('/forgot-password') || path.startsWith('/reset-password') || path.startsWith('/demo-ui');

  if (isAdminRoute) {
    if (!token) {
      const login = new URL('/login', request.url);
      login.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(login);
    }
    if (!token.isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (isMatchmakerRoute) {
    if (!token) {
      const login = new URL('/login', request.url);
      login.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(login);
    }
    if (!token.isMatchmaker) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

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

  return NextResponse.next({ request: { headers: normalizedHeaders } });
}

export const config = {
  matcher: [
    '/_next/static/:path*',
    '/api/:path*',
    '/host/:path*',
    '/nanny/:path*',
    '/admin/:path*',
    '/matchmaker/:path*',
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
