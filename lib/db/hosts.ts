/**
 * SQL Hosts table. Same API as lib/airtable/hosts.
 * Stores core columns (user_id, location, tier) + JSONB data for all other Host fields.
 */

import type { Host } from '@/types/airtable';
import { query } from './pool';

function rowToHost(row: Record<string, unknown>): Host {
  const data = (row.data as Record<string, unknown>) ?? {};
  return {
    id: row.id as string,
    createdTime: row.created_time != null ? new Date(row.created_time as string).toISOString() : undefined,
    userId: (row.user_id as string) ?? undefined,
    location: (row.location as string) ?? (data.location as string),
    tier: (row.tier as string) ?? (data.tier as string),
    ...data,
  } as Host;
}

export async function getHost(id: string): Promise<Host | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM hosts WHERE id = $1 LIMIT 1',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToHost(rows[0]!);
}

export async function getHosts(params?: { maxRecords?: number }): Promise<Host[]> {
  const limit = params?.maxRecords ?? 100;
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM hosts ORDER BY created_time DESC LIMIT $1',
    [limit]
  );
  return rows.map((r) => rowToHost(r));
}

/** Get host record by linked user ID (for tier updates from GHL). */
export async function getHostByUserId(userId: string): Promise<Host | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM hosts WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  if (rows.length === 0) return null;
  return rowToHost(rows[0]!);
}

export const getAllHosts = getHosts;

function hostToRow(fields: Record<string, unknown>): { user_id: string | null; location: string | null; tier: string | null; data: Record<string, unknown> } {
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

export async function createHost(fields: Record<string, unknown>): Promise<Host & { id: string }> {
  const { user_id, location, tier, data } = hostToRow(fields);
  const { rows } = await query<Record<string, unknown>>(
    `INSERT INTO hosts (user_id, location, tier, data) VALUES ($1, $2, $3, $4) RETURNING *`,
    [user_id, location, tier, JSON.stringify(data)]
  );
  const host = rowToHost(rows[0]!);
  return { ...host, id: rows[0]!.id as string };
}

export async function updateHost(id: string, fields: Partial<Record<string, unknown>>): Promise<Host> {
  const existing = await getHost(id);
  if (!existing) throw new Error('Host not found');
  const merged = { ...existing, ...fields };
  const { user_id, location, tier, data } = hostToRow(merged as Record<string, unknown>);
  const { rows } = await query<Record<string, unknown>>(
    `UPDATE hosts SET user_id = $1, location = $2, tier = $3, data = $4 WHERE id = $5 RETURNING *`,
    [user_id, location, tier, JSON.stringify(data), id]
  );
  return rowToHost(rows[0]!);
}
