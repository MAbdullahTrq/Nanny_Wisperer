/**
 * Map app field names to Airtable Nannies table field names.
 * When your base uses camelCase (e.g. firstName), keys pass through as-is.
 * nannyType is omitted unless config.airtable.nanniesHaveNannyTypeField is true (for bases that don't have that column).
 */

import { config } from '@/lib/config';

const NANNY_FIELD_TO_AIRTABLE: Record<string, string> = {};

/** Keys to omit when the base doesn't have these columns (avoids UNKNOWN_FIELD_NAME). */
const OMIT_WHEN_NOT_IN_BASE = new Set<string>(['nannyType']);

/** Reverse map: Airtable field name → app camelCase (for reading) */
const AIRTABLE_TO_NANNY_FIELD: Record<string, string> = {};

/**
 * Convert payload keys to Airtable field names. Keys not in the map are passed through as-is (camelCase).
 * Omits nannyType unless AIRTABLE_NANNIES_HAVE_NANNY_TYPE=true so bases without that column can save.
 */
export function nannyFieldsToAirtable(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const includeNannyType = config.airtable.nanniesHaveNannyTypeField;
  for (const [key, value] of Object.entries(fields)) {
    if (OMIT_WHEN_NOT_IN_BASE.has(key) && !includeNannyType) continue;
    const airtableKey = NANNY_FIELD_TO_AIRTABLE[key] ?? key;
    out[airtableKey] = value;
  }
  return out;
}

/**
 * Convert Airtable response fields to app camelCase (for reading nanny records).
 */
export function airtableFieldsToNanny(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    const appKey = AIRTABLE_TO_NANNY_FIELD[key] ?? key;
    out[appKey] = value;
  }
  return out;
}
