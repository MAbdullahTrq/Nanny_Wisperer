/**
 * SQL Users table. Same API as lib/airtable/users.
 */

import { query } from './pool';
import type { User, UserType } from '@/types/airtable';

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: (row.email as string) ?? '',
    name: (row.name as string) ?? undefined,
    userType: (row.user_type as UserType) ?? 'Host',
    passwordHash: (row.password_hash as string) ?? undefined,
    ghlContactId: (row.ghl_contact_id as string) ?? undefined,
    airtableHostId: (row.airtable_host_id as string) ?? undefined,
    airtableNannyId: (row.airtable_nanny_id as string) ?? undefined,
    emailVerified: Boolean(row.email_verified),
    isAdmin: Boolean(row.is_admin),
    isMatchmaker: Boolean(row.is_matchmaker),
    locked: Boolean(row.locked),
    createdTime: row.created_time != null ? new Date(row.created_time as string).toISOString() : undefined,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  if (rows.length === 0) return null;
  return rowToUser(rows[0]!);
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToUser(rows[0]!);
}

/** Find user by GHL contact ID (for webhooks when payment/tag updates tier). */
export async function getUserByGhlContactId(ghlContactId: string): Promise<User | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM users WHERE ghl_contact_id = $1 LIMIT 1',
    [ghlContactId]
  );
  if (rows.length === 0) return null;
  return rowToUser(rows[0]!);
}

/** Find user by Airtable nanny ID (for sending interview request emails to nanny). */
export async function getUserByNannyId(airtableNannyId: string): Promise<User | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM users WHERE airtable_nanny_id = $1 LIMIT 1',
    [airtableNannyId]
  );
  if (rows.length === 0) return null;
  return rowToUser(rows[0]!);
}

/** Find user by Airtable host ID (for sending shortlist-delivered email to host). */
export async function getUserByHostId(airtableHostId: string): Promise<User | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM users WHERE airtable_host_id = $1 LIMIT 1',
    [airtableHostId]
  );
  if (rows.length === 0) return null;
  return rowToUser(rows[0]!);
}

const BATCH_SIZE = 50;

export async function getUsersByIds(ids: string[]): Promise<Map<string, User>> {
  const unique = Array.from(new Set(ids)).filter(Boolean);
  const map = new Map<string, User>();
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const chunk = unique.slice(i, i + BATCH_SIZE);
    const placeholders = chunk.map((_, j) => `$${j + 1}`).join(',');
    const { rows } = await query<Record<string, unknown>>(
      `SELECT * FROM users WHERE id IN (${placeholders})`,
      chunk
    );
    for (const row of rows) {
      map.set(row.id as string, rowToUser(row));
    }
  }
  return map;
}

export async function createUser(data: {
  email: string;
  name?: string;
  userType: UserType;
  passwordHash?: string;
  ghlContactId?: string;
}): Promise<User> {
  const { rows } = await query<Record<string, unknown>>(
    `INSERT INTO users (email, name, user_type, password_hash, ghl_contact_id, email_verified)
     VALUES ($1, $2, $3, $4, $5, false)
     RETURNING *`,
    [
      data.email,
      data.name ?? '',
      data.userType,
      data.passwordHash ?? null,
      data.ghlContactId ?? null,
    ]
  );
  return rowToUser(rows[0]!);
}

export async function updateUser(
  id: string,
  fields: Partial<Pick<User, 'name' | 'userType' | 'passwordHash' | 'ghlContactId' | 'airtableHostId' | 'airtableNannyId' | 'emailVerified' | 'isAdmin' | 'isMatchmaker' | 'locked'>>
): Promise<User> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let n = 1;
  if (fields.name !== undefined) { updates.push(`name = $${n++}`); values.push(fields.name); }
  if (fields.userType !== undefined) { updates.push(`user_type = $${n++}`); values.push(fields.userType); }
  if (fields.passwordHash !== undefined) { updates.push(`password_hash = $${n++}`); values.push(fields.passwordHash); }
  if (fields.ghlContactId !== undefined) { updates.push(`ghl_contact_id = $${n++}`); values.push(fields.ghlContactId); }
  if (fields.airtableHostId !== undefined) { updates.push(`airtable_host_id = $${n++}`); values.push(fields.airtableHostId); }
  if (fields.airtableNannyId !== undefined) { updates.push(`airtable_nanny_id = $${n++}`); values.push(fields.airtableNannyId); }
  if (fields.emailVerified !== undefined) { updates.push(`email_verified = $${n++}`); values.push(fields.emailVerified); }
  if (fields.isAdmin !== undefined) { updates.push(`is_admin = $${n++}`); values.push(fields.isAdmin); }
  if (fields.isMatchmaker !== undefined) { updates.push(`is_matchmaker = $${n++}`); values.push(fields.isMatchmaker); }
  if (fields.locked !== undefined) { updates.push(`locked = $${n++}`); values.push(fields.locked); }
  if (updates.length === 0) {
    const user = await getUserById(id);
    if (!user) throw new Error('User not found');
    return user;
  }
  values.push(id);
  const { rows } = await query<Record<string, unknown>>(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
    values
  );
  return rowToUser(rows[0]!);
}
