/**
 * Airtable GoogleCalendarTokens table. T8.4 — store refresh token per user.
 */

import type { GoogleCalendarToken } from '@/types/airtable';
import { airtableCreate, airtableGet, airtableUpdate } from './client';

const TABLE = 'GoogleCalendarTokens';

function recordToToken(record: {
  id: string;
  fields: Record<string, unknown>;
}): GoogleCalendarToken {
  const f = record.fields;
  return {
    id: record.id,
    userId: f.userId as string | undefined,
    refreshToken: f.refreshToken as string | undefined,
    calendarId: f.calendarId as string | undefined,
    updatedTime: f.updatedTime as string | undefined,
  };
}

export async function getGoogleCalendarTokenByUserId(
  userId: string
): Promise<GoogleCalendarToken | null> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE, {
    filterByFormula: `{userId} = '${userId.replace(/'/g, "\\'")}'`,
    maxRecords: 1,
  });
  if (records.length === 0) return null;
  return recordToToken(records[0] as { id: string; fields: Record<string, unknown> });
}

export async function upsertGoogleCalendarToken(
  userId: string,
  data: { refreshToken: string; calendarId: string }
): Promise<GoogleCalendarToken> {
  const existing = await getGoogleCalendarTokenByUserId(userId);
  const updatedTime = new Date().toISOString();
  const fields = {
    userId,
    refreshToken: data.refreshToken,
    calendarId: data.calendarId,
    updatedTime,
  };
  if (existing?.id) {
    await airtableUpdate(TABLE, existing.id, fields);
    return { ...existing, ...fields, id: existing.id };
  }
  const created = await airtableCreate(TABLE, fields);
  return recordToToken({
    id: created.id,
    fields: created.fields as Record<string, unknown>,
  });
}
