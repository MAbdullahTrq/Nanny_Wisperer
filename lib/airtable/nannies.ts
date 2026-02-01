/**
 * Airtable Nannies table. T3.1 — getNanny, getNannies.
 */

import type { Nanny } from '@/types/airtable';
import { airtableCreate, airtableGet, airtableGetRecord, airtableUpdate } from './client';

const TABLE = 'Nannies';

function recordToNanny(record: { id: string; fields: Record<string, unknown>; createdTime?: string }): Nanny {
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...record.fields,
  } as Nanny;
}

export async function getNanny(id: string): Promise<Nanny | null> {
  const record = await airtableGetRecord<Record<string, unknown>>(TABLE, id);
  if (!record) return null;
  return recordToNanny(record);
}

export async function getNannies(params?: { maxRecords?: number; filterByFormula?: string }): Promise<Nanny[]> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE, {
    maxRecords: params?.maxRecords ?? 100,
    filterByFormula: params?.filterByFormula,
  });
  return records.map((r) => recordToNanny(r));
}

export async function getNanniesByTier(tier: string): Promise<Nanny[]> {
  return getNannies({
    filterByFormula: `{tier} = '${tier.replace(/'/g, "\\'")}'`,
  });
}

/** Alias for getNannies (used by matching.ts). */
export const getAllNannies = getNannies;

/** Create a Nanny record. */
export async function createNanny(fields: Record<string, unknown>): Promise<Nanny & { id: string }> {
  const created = await airtableCreate(TABLE, fields);
  return { ...recordToNanny(created), id: created.id };
}

/** Update a Nanny record. */
export async function updateNanny(id: string, fields: Partial<Record<string, unknown>>): Promise<Nanny> {
  const updated = await airtableUpdate(TABLE, id, fields);
  return recordToNanny(updated);
}
