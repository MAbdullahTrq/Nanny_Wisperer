/**
 * Airtable Hosts table. T3.1 — getHost, getNanny, getHosts, getNannies live in hosts/nannies.
 */

import type { Host } from '@/types/airtable';
import { airtableCreate, airtableGet, airtableGetRecord, airtableUpdate } from './client';

const TABLE = 'Hosts';

function recordToHost(record: { id: string; fields: Record<string, unknown>; createdTime?: string }): Host {
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...record.fields,
  } as Host;
}

export async function getHost(id: string): Promise<Host | null> {
  const record = await airtableGetRecord<Record<string, unknown>>(TABLE, id);
  if (!record) return null;
  return recordToHost(record);
}

export async function getHosts(params?: { maxRecords?: number }): Promise<Host[]> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE, {
    maxRecords: params?.maxRecords ?? 100,
  });
  return records.map((r) => recordToHost(r));
}

/** Alias for getHosts (used by matching.ts). */
export const getAllHosts = getHosts;

/** Create a Host record. Fields are sent as-is; omit id/createdTime. */
export async function createHost(fields: Record<string, unknown>): Promise<Host & { id: string }> {
  const created = await airtableCreate(TABLE, fields);
  return { ...recordToHost(created), id: created.id };
}

/** Update a Host record. */
export async function updateHost(id: string, fields: Partial<Record<string, unknown>>): Promise<Host> {
  const updated = await airtableUpdate(TABLE, id, fields);
  return recordToHost(updated);
}
