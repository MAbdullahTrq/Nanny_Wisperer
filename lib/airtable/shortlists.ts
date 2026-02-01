/**
 * Airtable Shortlists table. T3.2 — getShortlist, createShortlist, updateShortlist.
 */

import type { Shortlist } from '@/types/airtable';
import { airtableCreate, airtableGet, airtableGetRecord, airtableUpdate } from './client';

const TABLE = 'Shortlists';

function recordToShortlist(record: {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}): Shortlist {
  const matchIds = record.fields.matchIds as string[] | undefined;
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...record.fields,
    matchIds: Array.isArray(matchIds) ? matchIds : undefined,
  } as Shortlist;
}

export async function getShortlist(id: string): Promise<Shortlist | null> {
  const record = await airtableGetRecord<Record<string, unknown>>(TABLE, id);
  if (!record) return null;
  return recordToShortlist(record);
}

export async function getShortlistsByHost(hostId: string): Promise<Shortlist[]> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE, {
    filterByFormula: `{hostId} = '${hostId.replace(/'/g, "\\'")}'`,
    maxRecords: 100,
  });
  return records.map((r) => recordToShortlist(r));
}

export async function createShortlist(data: {
  hostId: string;
  matchIds?: string[];
  deliveredAt?: string;
}): Promise<Shortlist & { id: string }> {
  const fields: Record<string, unknown> = {
    hostId: data.hostId,
    deliveredAt: data.deliveredAt,
  };
  if (data.matchIds?.length) fields.matchIds = data.matchIds;
  const created = await airtableCreate(TABLE, fields);
  return { ...recordToShortlist(created), id: created.id };
}

export async function updateShortlist(
  id: string,
  fields: Partial<{ matchIds: string[]; deliveredAt: string }>
): Promise<Shortlist> {
  const updated = await airtableUpdate(TABLE, id, fields as Record<string, unknown>);
  return recordToShortlist(updated);
}
