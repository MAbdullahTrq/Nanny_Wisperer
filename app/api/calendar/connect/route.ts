/**
 * T8.4 — Start Google Calendar OAuth. Redirects to Google; callback saves token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { config } from '@/lib/config';

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const REDIRECT_URI_PATH = '/api/calendar/callback';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { userId?: string }).userId : null;
  if (!userId) {
    return NextResponse.redirect(new URL('/login', config.app.url));
  }

  const redirectUri = new URL(REDIRECT_URI_PATH, config.app.url).toString();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', config.google.clientId || '');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', userId);

  return NextResponse.redirect(url.toString());
}
