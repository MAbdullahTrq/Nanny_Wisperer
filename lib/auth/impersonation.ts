/**
 * One-time JWT for admin "log in as user". Signed with NEXTAUTH_SECRET.
 * Token is short-lived (e.g. 5 min) and single-use is enforced by not reusing the same flow.
 */

import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';

const IMPERSONATION_EXPIRY = '5m';

export function createImpersonationToken(targetUserId: string): string {
  const secret = config.auth.nextAuthSecret || config.auth.jwtSecret || 'fallback-dev-secret';
  return jwt.sign(
    { targetUserId, purpose: 'impersonation' },
    secret,
    { expiresIn: IMPERSONATION_EXPIRY }
  );
}

export function verifyImpersonationToken(token: string): { targetUserId: string } | null {
  try {
    const secret = config.auth.nextAuthSecret || config.auth.jwtSecret || 'fallback-dev-secret';
    const decoded = jwt.verify(token, secret) as { targetUserId?: string; purpose?: string };
    if (decoded?.purpose !== 'impersonation' || !decoded?.targetUserId) return null;
    return { targetUserId: decoded.targetUserId };
  } catch {
    return null;
  }
}
