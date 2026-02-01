/**
 * T8.4 — Google Calendar OAuth callback. Exchange code for tokens, store refresh token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { upsertGoogleCalendarToken } from '@/lib/airtable/google-calendar-tokens';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    const redirect = new URL('/host/dashboard', config.app.url);
    redirect.searchParams.set('calendar', 'error');
    return NextResponse.redirect(redirect.toString());
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login', config.app.url));
  }

  const redirectUri = new URL('/api/calendar/callback', config.app.url).toString();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.google.clientId || '',
      client_secret: config.google.clientSecret || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const redirect = new URL('/host/dashboard', config.app.url);
    redirect.searchParams.set('calendar', 'error');
    return NextResponse.redirect(redirect.toString());
  }

  const data = (await res.json()) as {
    refresh_token?: string;
    access_token?: string;
  };

  if (!data.refresh_token && !data.access_token) {
    const redirect = new URL('/host/dashboard', config.app.url);
    redirect.searchParams.set('calendar', 'error');
    return NextResponse.redirect(redirect.toString());
  }

  let calendarId = 'primary';
  if (data.access_token) {
    const listRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }
    );
    if (listRes.ok) {
      const list = (await listRes.json()) as { items?: Array<{ id: string }> };
      if (list.items?.[0]?.id) calendarId = list.items[0].id;
    }
  }

  await upsertGoogleCalendarToken(state, {
    refreshToken: data.refresh_token ?? data.access_token ?? '',
    calendarId,
  });

  const redirect = new URL('/host/dashboard', config.app.url);
  redirect.searchParams.set('calendar', 'connected');
  return NextResponse.redirect(redirect.toString());
}
