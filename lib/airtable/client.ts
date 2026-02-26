/**
 * Airtable REST API client. Uses config.airtable (Personal Access Token, baseId).
 * Base ID must start with "app" (from base URL); using a table ID (tbl...) causes 404.
 */

import { config } from '@/lib/config';

const AIRTABLE_API = 'https://api.airtable.com/v0';

function getBaseId(): string {
  const baseId = (config.airtable.baseId || '').trim();
  if (!baseId) throw new Error('AIRTABLE_BASE_ID is missing.');
  if (!baseId.toLowerCase().startsWith('app')) {
    throw new Error(
      'AIRTABLE_BASE_ID should be a base ID (starts with "app"), not a table ID. Get it from your Airtable base URL: airtable.com/appXXXXXXXX/...'
    );
  }
  return baseId;
}

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
  const baseId = getBaseId();
  const url = new URL(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(tableName)}`);
  if (params?.filterByFormula) url.searchParams.set('filterByFormula', params.filterByFormula);
  if (params?.maxRecords) url.searchParams.set('maxRecords', String(params.maxRecords));
  if (params?.view) url.searchParams.set('view', params.view);

  const res = await fetch(url.toString(), { headers: getHeaders(), cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403) {
      console.error(
        '[airtable] GET 403 – table name requested:',
        JSON.stringify(tableName),
        '– Airtable response:',
        body
      );
    }
    throw new Error(`Airtable GET ${tableName}: ${res.status} ${body}`);
  }
  return res.json();
}

export async function airtableGetRecord<T = unknown>(
  tableName: string,
  recordId: string
): Promise<{ id: string; fields: T; createdTime?: string } | null> {
  const baseId = getBaseId();
  const url = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`;
  const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Airtable GET record ${tableName}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Airtable checkbox fields must be boolean; normalize to avoid INVALID_VALUE_FOR_COLUMN (e.g. "false" string). */
const CHECKBOX_FIELDS: string[] = ['emailVerified', 'isAdmin', 'isMatchmaker', 'locked'];

function normalizeFieldsForCreate<T>(fields: T): T {
  const raw = fields as Record<string, unknown>;
  const out = { ...raw } as Record<string, unknown>;
  for (const key of CHECKBOX_FIELDS) {
    if (key in out && out[key] !== undefined) {
      out[key] = out[key] === true || (typeof out[key] === 'string' && (out[key] as string).toLowerCase() === 'true');
    }
  }
  return out as T;
}

export async function airtableCreate<T = Record<string, unknown>>(
  tableName: string,
  fields: T
): Promise<{ id: string; fields: T; createdTime: string }> {
  const baseId = getBaseId();
  const url = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(tableName)}`;
  const normalized = normalizeFieldsForCreate(fields);
  const payload = { fields: normalized, typecast: true };
  const bodyStr = JSON.stringify(payload);
  // #region agent log (Vercel: see Function logs in dashboard)
  const f = normalized as Record<string, unknown>;
  const logC = { location: 'lib/airtable/client.ts:airtableCreate', message: 'body before fetch (normalized)', data: { tableName, emailVerifiedVal: f?.emailVerified, emailVerifiedType: typeof f?.emailVerified, bodyContainsQuotedFalse: bodyStr.includes('"emailVerified":"false"') }, hypothesisId: 'C' };
  console.log('[debug]', JSON.stringify(logC));
  // #endregion
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: bodyStr,
  });
  if (!res.ok) throw new Error(`Airtable POST ${tableName}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, fields: data.fields, createdTime: data.createdTime };
}

function normalizeFieldsForUpdate<T>(fields: Partial<T>): Partial<T> {
  const raw = fields as Record<string, unknown>;
  const out = { ...raw } as Record<string, unknown>;
  for (const key of CHECKBOX_FIELDS) {
    if (key in out && out[key] !== undefined) {
      out[key] = out[key] === true || (typeof out[key] === 'string' && (out[key] as string).toLowerCase() === 'true');
    }
  }
  return out as Partial<T>;
}

export async function airtableUpdate<T = Record<string, unknown>>(
  tableName: string,
  recordId: string,
  fields: Partial<T>
): Promise<{ id: string; fields: T }> {
  const baseId = getBaseId();
  const url = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`;
  const normalized = normalizeFieldsForUpdate(fields);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ fields: normalized, typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable PATCH ${tableName}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, fields: data.fields };
}
