/**
 * Airtable PasswordResetTokens table. Fields: email, token, expiresAt, createdTime.
 */

import { airtableGet, airtableCreate, airtableUpdate } from './client';

const TABLE = 'PasswordResetTokens';

export async function createResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
  await airtableCreate(TABLE, {
    email,
    token,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function findValidResetToken(token: string): Promise<{ email: string } | null> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE, {
    filterByFormula: `{token} = "${token.replace(/"/g, '\\"')}"`,
    maxRecords: 1,
  });
  if (records.length === 0) return null;
  const r = records[0];
  const expiresAt = (r.fields?.expiresAt as string) || '';
  if (new Date(expiresAt) < new Date()) return null;
  return { email: (r.fields?.email as string) || '' };
}

export async function invalidateResetToken(token: string): Promise<void> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE, {
    filterByFormula: `{token} = "${token.replace(/"/g, '\\"')}"`,
    maxRecords: 1,
  });
  if (records.length > 0) {
    await airtableUpdate(TABLE, records[0].id, { expiresAt: new Date(0).toISOString() });
  }
}
