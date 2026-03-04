/**
 * SQL Matches table. Same API as lib/airtable/matches.
 */

import type { Match } from '@/types/airtable';
import { query } from './pool';

function rowToMatch(row: Record<string, unknown>): Match {
  return {
    id: row.id as string,
    createdTime: row.created_time != null ? new Date(row.created_time as string).toISOString() : undefined,
    hostId: row.host_id as string,
    nannyId: row.nanny_id as string,
    score: row.score != null ? Number(row.score) : undefined,
    hostProceed: Boolean(row.host_proceed),
    nannyProceed: Boolean(row.nanny_proceed),
    bothProceedAt: row.both_proceed_at != null ? new Date(row.both_proceed_at as string).toISOString() : undefined,
    status: row.status as Match['status'],
    matchSource: row.match_source as Match['matchSource'],
    sentToHostAt: row.sent_to_host_at != null ? new Date(row.sent_to_host_at as string).toISOString() : undefined,
    sentToCaregiverAt: row.sent_to_caregiver_at != null ? new Date(row.sent_to_caregiver_at as string).toISOString() : undefined,
  };
}

export async function getMatch(id: string): Promise<Match | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM matches WHERE id = $1 LIMIT 1',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToMatch(rows[0]!);
}

export async function getMatchesByHost(hostId: string): Promise<Match[]> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM matches WHERE host_id = $1 ORDER BY created_time DESC',
    [hostId]
  );
  return rows.map((r) => rowToMatch(r));
}

export async function getMatchesByNanny(nannyId: string): Promise<Match[]> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM matches WHERE nanny_id = $1 ORDER BY created_time DESC',
    [nannyId]
  );
  return rows.map((r) => rowToMatch(r));
}

export async function getMatches(params?: { filterByFormula?: string; maxRecords?: number }): Promise<Match[]> {
  const limit = params?.maxRecords ?? 500;
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM matches ORDER BY created_time DESC LIMIT $1',
    [limit]
  );
  return rows.map((r) => rowToMatch(r));
}

export async function createMatch(data: {
  hostId: string;
  nannyId: string;
  score?: number;
  hostProceed?: boolean;
  nannyProceed?: boolean;
  bothProceedAt?: string;
  status?: string;
  matchSource?: 'auto' | 'admin_curated' | 'premium_concierge';
  sentToHostAt?: string;
  sentToCaregiverAt?: string;
}): Promise<Match & { id: string }> {
  const { rows } = await query<Record<string, unknown>>(
    `INSERT INTO matches (host_id, nanny_id, score, host_proceed, nanny_proceed, both_proceed_at, status, match_source, sent_to_host_at, sent_to_caregiver_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.hostId,
      data.nannyId,
      data.score ?? null,
      data.hostProceed ?? false,
      data.nannyProceed ?? false,
      data.bothProceedAt ?? null,
      data.status ?? 'pending',
      data.matchSource ?? 'auto',
      data.sentToHostAt ?? null,
      data.sentToCaregiverAt ?? null,
    ]
  );
  return { ...rowToMatch(rows[0]!), id: rows[0]!.id as string };
}

export async function updateMatch(
  id: string,
  fields: Partial<{
    score: number;
    hostProceed: boolean;
    nannyProceed: boolean;
    bothProceedAt: string;
    status: string;
    matchSource: 'auto' | 'admin_curated' | 'premium_concierge';
    sentToHostAt: string;
    sentToCaregiverAt: string;
  }>
): Promise<Match> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let n = 1;
  if (fields.score !== undefined) { updates.push(`score = $${n++}`); values.push(fields.score); }
  if (fields.hostProceed !== undefined) { updates.push(`host_proceed = $${n++}`); values.push(fields.hostProceed); }
  if (fields.nannyProceed !== undefined) { updates.push(`nanny_proceed = $${n++}`); values.push(fields.nannyProceed); }
  if (fields.bothProceedAt !== undefined) { updates.push(`both_proceed_at = $${n++}`); values.push(fields.bothProceedAt); }
  if (fields.status !== undefined) { updates.push(`status = $${n++}`); values.push(fields.status); }
  if (fields.matchSource !== undefined) { updates.push(`match_source = $${n++}`); values.push(fields.matchSource); }
  if (fields.sentToHostAt !== undefined) { updates.push(`sent_to_host_at = $${n++}`); values.push(fields.sentToHostAt); }
  if (fields.sentToCaregiverAt !== undefined) { updates.push(`sent_to_caregiver_at = $${n++}`); values.push(fields.sentToCaregiverAt); }
  if (updates.length === 0) {
    const m = await getMatch(id);
    if (!m) throw new Error('Match not found');
    return m;
  }
  values.push(id);
  const { rows } = await query<Record<string, unknown>>(
    `UPDATE matches SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
    values
  );
  return rowToMatch(rows[0]!);
}
