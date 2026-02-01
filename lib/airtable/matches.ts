/**
 * Airtable Matches table. T3.2 — getMatchesByHost, getMatchesByNanny, getMatch, createMatch, updateMatch.
 */

import type { Match } from '@/types/airtable';
import { airtableCreate, airtableGet, airtableGetRecord, airtableUpdate } from './client';

const TABLE = 'Matches';

function recordToMatch(record: { id: string; fields: Record<string, unknown>; createdTime?: string }): Match {
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...record.fields,
  } as Match;
}

export async function getMatch(id: string): Promise<Match | null> {
  const record = await airtableGetRecord<Record<string, unknown>>(TABLE, id);
  if (!record) return null;
  return recordToMatch(record);
}

export async function getMatchesByHost(hostId: string): Promise<Match[]> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE, {
    filterByFormula: `{hostId} = '${hostId.replace(/'/g, "\\'")}'`,
    maxRecords: 500,
  });
  return records.map((r) => recordToMatch(r));
}

export async function getMatchesByNanny(nannyId: string): Promise<Match[]> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE, {
    filterByFormula: `{nannyId} = '${nannyId.replace(/'/g, "\\'")}'`,
    maxRecords: 500,
  });
  return records.map((r) => recordToMatch(r));
}

export async function createMatch(data: {
  hostId: string;
  nannyId: string;
  score?: number;
  hostProceed?: boolean;
  nannyProceed?: boolean;
  bothProceedAt?: string;
  status?: string;
}): Promise<Match & { id: string }> {
  const created = await airtableCreate(TABLE, data as Record<string, unknown>);
  return { ...recordToMatch(created), id: created.id };
}

export async function updateMatch(
  id: string,
  fields: Partial<{
    score: number;
    hostProceed: boolean;
    nannyProceed: boolean;
    bothProceedAt: string;
    status: string;
  }>
): Promise<Match> {
  const updated = await airtableUpdate(TABLE, id, fields as Record<string, unknown>);
  return recordToMatch(updated);
}
