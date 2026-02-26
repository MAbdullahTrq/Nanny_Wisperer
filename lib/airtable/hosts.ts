/**
 * Airtable Hosts table. T3.1 — getHost, getNanny, getHosts, getNannies live in hosts/nannies.
 * Uses host-field-names to map between app camelCase and Airtable "Title with spaces" field names.
 */

import type { Host } from '@/types/airtable';
import { config } from '@/lib/config';
import { airtableCreate, airtableGet, airtableGetRecord, airtableUpdate } from './client';
import { airtableFieldsToHost, hostFieldsToAirtable } from './host-field-names';

const TABLE = () => config.airtable.hostsTableName;

function recordToHost(record: { id: string; fields: Record<string, unknown>; createdTime?: string }): Host {
  const fields = airtableFieldsToHost(record.fields as Record<string, unknown>);
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...fields,
  } as Host;
}

export async function getHost(id: string): Promise<Host | null> {
  const record = await airtableGetRecord<Record<string, unknown>>(TABLE(), id);
  if (!record) return null;
  return recordToHost(record);
}

export async function getHosts(params?: { maxRecords?: number }): Promise<Host[]> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE(), {
    maxRecords: params?.maxRecords ?? 100,
  });
  return records.map((r) => recordToHost(r));
}

/** Alias for getHosts (used by matching.ts). */
export const getAllHosts = getHosts;

/** Create a Host record. Fields in app camelCase are mapped to Airtable field names. */
export async function createHost(fields: Record<string, unknown>): Promise<Host & { id: string }> {
  const airtableFields = hostFieldsToAirtable(fields);
  const created = await airtableCreate(TABLE(), airtableFields);
  return { ...recordToHost(created), id: created.id };
}

/** Update a Host record. Fields in app camelCase are mapped to Airtable field names. */
export async function updateHost(id: string, fields: Partial<Record<string, unknown>>): Promise<Host> {
  const airtableFields = hostFieldsToAirtable(fields as Record<string, unknown>);
  const updated = await airtableUpdate(TABLE(), id, airtableFields);
  return recordToHost(updated);
}
