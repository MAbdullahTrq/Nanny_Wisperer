/**
 * Google Calendar: OAuth refresh and freebusy. T8.4 — getFreeSlots for host (and Kayley).
 */

import { config } from '@/lib/config';
import { getGoogleCalendarTokenByUserId } from '@/lib/airtable/google-calendar-tokens';

export interface FreeSlot {
  start: string;
  end: string;
}

export interface BusyInterval {
  start: string;
  end: string;
}

/** Get access token from refresh token. */
async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('No access_token in response');
  return data.access_token;
}

/** Call Google Calendar freeBusy API; returns busy intervals for the calendar. */
async function getBusyIntervalsFromGoogle(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<BusyInterval[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google freeBusy failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
  };
  const cal = data.calendars?.[calendarId];
  if (!cal?.busy) return [];
  return cal.busy.map((b) => ({ start: b.start, end: b.end }));
}

/**
 * Get free slots for a user in a date range. Uses stored Google Calendar token.
 * If no token, returns the whole range as one free slot (stub) so host can still pick times.
 */
export async function getFreeSlots(
  userId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<FreeSlot[]> {
  const tokenRecord = await getGoogleCalendarTokenByUserId(userId);
  const timeMin = dateFrom.toISOString();
  const timeMax = dateTo.toISOString();

  if (!tokenRecord?.refreshToken || !tokenRecord.calendarId) {
    return [{ start: timeMin, end: timeMax }];
  }

  const accessToken = await getAccessToken(tokenRecord.refreshToken);
  const busy = await getBusyIntervalsFromGoogle(
    accessToken,
    tokenRecord.calendarId,
    timeMin,
    timeMax
  );

  return busyToFreeSlots(timeMin, timeMax, busy);
}

/**
 * Get busy intervals for a user's calendar (by userId).
 */
export async function getBusyIntervals(
  userId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<BusyInterval[]> {
  const tokenRecord = await getGoogleCalendarTokenByUserId(userId);
  if (!tokenRecord?.refreshToken || !tokenRecord.calendarId) {
    return [];
  }
  const timeMin = dateFrom.toISOString();
  const timeMax = dateTo.toISOString();
  const accessToken = await getAccessToken(tokenRecord.refreshToken);
  return getBusyIntervalsFromGoogle(
    accessToken,
    tokenRecord.calendarId,
    timeMin,
    timeMax
  );
}

/**
 * Get busy intervals for a calendar when we have a refresh token in env (e.g. Kayley).
 * Uses KAYLEY_CALENDAR_ID and KAYLEY_REFRESH_TOKEN from config.
 */
export async function getBusyIntervalsForCalendarWithEnvToken(
  calendarId: string,
  refreshToken: string,
  dateFrom: Date,
  dateTo: Date
): Promise<BusyInterval[]> {
  const timeMin = dateFrom.toISOString();
  const timeMax = dateTo.toISOString();
  const accessToken = await getAccessToken(refreshToken);
  return getBusyIntervalsFromGoogle(accessToken, calendarId, timeMin, timeMax);
}

/** Invert busy intervals to free slots (simple merge and gap extraction). */
function busyToFreeSlots(
  timeMin: string,
  timeMax: string,
  busy: BusyInterval[]
): FreeSlot[] {
  if (busy.length === 0) return [{ start: timeMin, end: timeMax }];

  const sorted = [...busy].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  const free: FreeSlot[] = [];
  let cursor = new Date(timeMin).getTime();
  const endMs = new Date(timeMax).getTime();

  for (const b of sorted) {
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    if (bStart > cursor && cursor < endMs) {
      free.push({
        start: new Date(cursor).toISOString(),
        end: new Date(Math.min(bStart, endMs)).toISOString(),
      });
    }
    cursor = Math.max(cursor, bEnd);
  }
  if (cursor < endMs) {
    free.push({
      start: new Date(cursor).toISOString(),
      end: timeMax,
    });
  }
  return free;
}
