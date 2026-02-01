/**
 * Airtable REST API client. Uses config.airtable (apiKey, baseId).
 */

import { config } from '@/lib/config';

const AIRTABLE_API = 'https://api.airtable.com/v0';

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${config.airtable.apiKey}`,
    'Content-Type': 'application/json',
  };
}

export async function airtableGet<T = unknown>(
  tableName: string,
  params?: { filterByFormula?: string; maxRecords?: number; view?: string }
): Promise<{ records: Array<{ id: string; fields: T; createdTime?: string }> }> {
  const url = new URL(`${AIRTABLE_API}/${config.airtable.baseId}/${encodeURIComponent(tableName)}`);
  if (params?.filterByFormula) url.searchParams.set('filterByFormula', params.filterByFormula);
  if (params?.maxRecords) url.searchParams.set('maxRecords', String(params.maxRecords));
  if (params?.view) url.searchParams.set('view', params.view);

  const res = await fetch(url.toString(), { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Airtable GET ${tableName}: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function airtableGetRecord<T = unknown>(
  tableName: string,
  recordId: string
): Promise<{ id: string; fields: T; createdTime?: string } | null> {
  const url = `${AIRTABLE_API}/${config.airtable.baseId}/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`;
  const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Airtable GET record ${tableName}: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function airtableCreate<T = Record<string, unknown>>(
  tableName: string,
  fields: T
): Promise<{ id: string; fields: T; createdTime: string }> {
  const url = `${AIRTABLE_API}/${config.airtable.baseId}/${encodeURIComponent(tableName)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Airtable POST ${tableName}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, fields: data.fields, createdTime: data.createdTime };
}

export async function airtableUpdate<T = Record<string, unknown>>(
  tableName: string,
  recordId: string,
  fields: Partial<T>
): Promise<{ id: string; fields: T }> {
  const url = `${AIRTABLE_API}/${config.airtable.baseId}/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Airtable PATCH ${tableName}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, fields: data.fields };
}
