/**
 * SQL Shortlists table. Same API as lib/airtable/shortlists.
 * match_ids stored in shortlist_matches junction table.
 */

import type { Shortlist } from '@/types/airtable';
import { query } from './pool';

export async function getShortlist(id: string): Promise<Shortlist | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM shortlists WHERE id = $1 LIMIT 1',
    [id]
  );
  if (rows.length === 0) return null;
  const row = rows[0]!;
  const { rows: matchRows } = await query<Record<string, unknown>>(
    'SELECT match_id FROM shortlist_matches WHERE shortlist_id = $1 ORDER BY ord',
    [id]
  );
  const matchIds = matchRows.map((r) => r.match_id as string);
  return {
    id: row.id as string,
    createdTime: row.created_time != null ? new Date(row.created_time as string).toISOString() : undefined,
    hostId: row.host_id as string,
    matchIds,
    deliveredAt: row.delivered_at != null ? new Date(row.delivered_at as string).toISOString() : undefined,
  };
}

export async function getShortlistsByHost(hostId: string): Promise<Shortlist[]> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM shortlists WHERE host_id = $1 ORDER BY created_time DESC',
    [hostId]
  );
  const result: Shortlist[] = [];
  for (const row of rows) {
    const sl = await getShortlist(row.id as string);
    if (sl) result.push(sl);
  }
  return result;
}

export async function createShortlist(data: {
  hostId: string;
  matchIds?: string[];
  deliveredAt?: string;
}): Promise<Shortlist & { id: string }> {
  const { rows } = await query<Record<string, unknown>>(
    `INSERT INTO shortlists (host_id, delivered_at) VALUES ($1, $2) RETURNING *`,
    [data.hostId, data.deliveredAt ?? null]
  );
  const id = rows[0]!.id as string;
  if (data.matchIds?.length) {
    for (let i = 0; i < data.matchIds.length; i++) {
      await query(
        'INSERT INTO shortlist_matches (shortlist_id, match_id, ord) VALUES ($1, $2, $3)',
        [id, data.matchIds[i], i]
      );
    }
  }
  const shortlist = await getShortlist(id);
  return { ...shortlist!, id };
}

export async function updateShortlist(
  id: string,
  fields: Partial<{ matchIds: string[]; deliveredAt: string }>
): Promise<Shortlist> {
  if (fields.deliveredAt !== undefined) {
    await query('UPDATE shortlists SET delivered_at = $1 WHERE id = $2', [fields.deliveredAt, id]);
  }
  if (fields.matchIds !== undefined) {
    await query('DELETE FROM shortlist_matches WHERE shortlist_id = $1', [id]);
    for (let i = 0; i < fields.matchIds.length; i++) {
      await query(
        'INSERT INTO shortlist_matches (shortlist_id, match_id, ord) VALUES ($1, $2, $3)',
        [id, fields.matchIds[i], i]
      );
    }
  }
  const sl = await getShortlist(id);
  if (!sl) throw new Error('Shortlist not found');
  return sl;
}
