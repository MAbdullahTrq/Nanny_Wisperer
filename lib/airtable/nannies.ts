/**
 * Airtable Nannies table. T3.1 — getNanny, getNannies.
 * Uses nanny-field-names to map between app camelCase and Airtable "Title with spaces" field names.
 */

import type { Nanny } from '@/types/airtable';
import { config } from '@/lib/config';
import { airtableCreate, airtableGet, airtableGetRecord, airtableUpdate } from './client';
import { airtableFieldsToNanny, nannyFieldsToAirtable } from './nanny-field-names';

const TABLE = () => config.airtable.nanniesTableName;

function recordToNanny(record: { id: string; fields: Record<string, unknown>; createdTime?: string }): Nanny {
  const fields = airtableFieldsToNanny(record.fields as Record<string, unknown>);
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...fields,
  } as Nanny;
}

export async function getNanny(id: string): Promise<Nanny | null> {
  const record = await airtableGetRecord<Record<string, unknown>>(TABLE(), id);
  if (!record) return null;
  return recordToNanny(record);
}

export async function getNannies(params?: { maxRecords?: number; filterByFormula?: string }): Promise<Nanny[]> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE(), {
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

/** Create a Nanny record. Fields in app camelCase are mapped to Airtable field names. */
export async function createNanny(fields: Record<string, unknown>): Promise<Nanny & { id: string }> {
  const airtableFields = nannyFieldsToAirtable(fields);
  const created = await airtableCreate(TABLE(), airtableFields);
  return { ...recordToNanny(created), id: created.id };
}

/** Update a Nanny record. Fields in app camelCase are mapped to Airtable field names. */
export async function updateNanny(id: string, fields: Partial<Record<string, unknown>>): Promise<Nanny> {
  const airtableFields = nannyFieldsToAirtable(fields as Record<string, unknown>);
  const updated = await airtableUpdate(TABLE(), id, airtableFields);
  return recordToNanny(updated);
}
