/**
 * SQL GoogleCalendarTokens. Same API as lib/airtable/google-calendar-tokens.
 */

import type { GoogleCalendarToken } from '@/types/airtable';
import { query } from './pool';

function rowToToken(row: Record<string, unknown>): GoogleCalendarToken {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    refreshToken: row.refresh_token as string,
    calendarId: row.calendar_id as string | undefined,
    updatedTime: row.updated_time != null ? new Date(row.updated_time as string).toISOString() : undefined,
  };
}

export async function getGoogleCalendarTokenByUserId(userId: string): Promise<GoogleCalendarToken | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM google_calendar_tokens WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  if (rows.length === 0) return null;
  return rowToToken(rows[0]!);
}

export async function upsertGoogleCalendarToken(
  userId: string,
  data: { refreshToken: string; calendarId: string }
): Promise<GoogleCalendarToken> {
  const existing = await getGoogleCalendarTokenByUserId(userId);
  const updatedTime = new Date();
  if (existing?.id) {
    await query(
      'UPDATE google_calendar_tokens SET refresh_token = $1, calendar_id = $2, updated_time = $3 WHERE id = $4',
      [data.refreshToken, data.calendarId, updatedTime, existing.id]
    );
    return { ...existing, ...data, updatedTime: updatedTime.toISOString() };
  }
  const { rows } = await query<Record<string, unknown>>(
    'INSERT INTO google_calendar_tokens (user_id, refresh_token, calendar_id, updated_time) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, data.refreshToken, data.calendarId, updatedTime]
  );
  return rowToToken(rows[0]!);
}
