/**
 * SQL Nannies table. Same API as lib/airtable/nannies.
 */

import type { Nanny } from '@/types/airtable';
import { query } from './pool';

function rowToNanny(row: Record<string, unknown>): Nanny {
  const data = (row.data as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    createdTime: row.created_time != null ? new Date(row.created_time as string).toISOString() : undefined,
    userId: (row.user_id as string) ?? undefined,
    location: (row.location as string) ?? (data.location as string),
    tier: (row.tier as string) ?? (data.tier as string),
    ...data,
  } as Nanny;
}

export async function getNanny(id: string): Promise<Nanny | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM nannies WHERE id = $1 LIMIT 1',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToNanny(rows[0]!);
}

/** Get nanny record by linked user ID (for tier updates from GHL). */
export async function getNannyByUserId(userId: string): Promise<Nanny | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM nannies WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  if (rows.length === 0) return null;
  return rowToNanny(rows[0]!);
}

export async function getNannies(params?: { maxRecords?: number; filterByFormula?: string }): Promise<Nanny[]> {
  const limit = params?.maxRecords ?? 100;
  let sql = 'SELECT * FROM nannies';
  const args: unknown[] = [];
  if (params?.filterByFormula) {
    const tierMatch = params.filterByFormula.match(/\{tier\}\s*=\s*'([^']+)'/);
    if (tierMatch) {
      sql += ' WHERE tier = $1';
      args.push(tierMatch[1]);
    }
  }
  sql += ' ORDER BY created_time DESC LIMIT $' + (args.length + 1);
  args.push(limit);
  const { rows } = await query<Record<string, unknown>>(sql, args);
  return rows.map((r) => rowToNanny(r));
}

export async function getNanniesByTier(tier: string): Promise<Nanny[]> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM nannies WHERE tier = $1 ORDER BY created_time DESC',
    [tier]
  );
  return rows.map((r) => rowToNanny(r));
}

export const getAllNannies = getNannies;

function nannyToRow(fields: Record<string, unknown>): { user_id: string | null; location: string | null; tier: string | null; data: Record<string, unknown> } {
  const userId = fields.userId != null ? String(fields.userId) : null;
  const location = fields.location != null ? String(fields.location) : null;
  const tier = fields.tier != null ? String(fields.tier) : null;
  const data = { ...fields };
  delete data.userId;
  delete data.location;
  delete data.tier;
  delete data.id;
  delete data.createdTime;
  return { user_id: userId, location, tier, data };
}

export async function createNanny(fields: Record<string, unknown>): Promise<Nanny & { id: string }> {
  const { user_id, location, tier, data } = nannyToRow(fields);
  const { rows } = await query<Record<string, unknown>>(
    'INSERT INTO nannies (user_id, location, tier, data) VALUES ($1, $2, $3, $4) RETURNING *',
    [user_id, location, tier, JSON.stringify(data)]
  );
  const nanny = rowToNanny(rows[0]!);
  return { ...nanny, id: rows[0]!.id as string };
}

export async function updateNanny(id: string, fields: Partial<Record<string, unknown>>): Promise<Nanny> {
  const existing = await getNanny(id);
  if (!existing) throw new Error('Nanny not found');
  const merged = { ...existing, ...fields };
  const { user_id, location, tier, data } = nannyToRow(merged as Record<string, unknown>);
  const { rows } = await query<Record<string, unknown>>(
    'UPDATE nannies SET user_id = $1, location = $2, tier = $3, data = $4 WHERE id = $5 RETURNING *',
    [user_id, location, tier, JSON.stringify(data), id]
  );
  return rowToNanny(rows[0]!);
}
