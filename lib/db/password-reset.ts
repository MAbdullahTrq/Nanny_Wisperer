/**
 * SQL PasswordResetTokens. Same API as lib/airtable/password-reset.
 */

import { query } from './pool';

export async function createResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
  await query(
    'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
    [email, token, expiresAt]
  );
}

export async function findValidResetToken(token: string): Promise<{ email: string } | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT email, expires_at FROM password_reset_tokens WHERE token = $1 LIMIT 1',
    [token]
  );
  if (rows.length === 0) return null;
  const row = rows[0]!;
  const expiresAt = row.expires_at;
  if (expiresAt != null && new Date(expiresAt as string) < new Date()) return null;
  return { email: (row.email as string) ?? '' };
}

export async function invalidateResetToken(token: string): Promise<void> {
  await query(
    'UPDATE password_reset_tokens SET expires_at = $1 WHERE token = $2',
    [new Date(0).toISOString(), token]
  );
}
