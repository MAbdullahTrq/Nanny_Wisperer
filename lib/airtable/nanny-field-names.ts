/**
 * Map app field names to Airtable Nannies table field names.
 * When your base uses camelCase (e.g. firstName), keys pass through as-is.
 * nannyType is omitted unless config.airtable.nanniesHaveNannyTypeField is true (for bases that don't have that column).
 */

import { config } from '@/lib/config';

const NANNY_FIELD_TO_AIRTABLE: Record<string, string> = {};

/** Reverse map: Airtable field name → app field name (for reading records). */
const AIRTABLE_TO_NANNY_FIELD: Record<string, string> = Object.fromEntries(
  Object.entries(NANNY_FIELD_TO_AIRTABLE).map(([app, at]) => [at, app])
);

/** Always omit these when sending to Airtable (avoids 422 if column missing). */
const ALWAYS_OMIT = new Set<string>(['euAuPairHoursAcknowledged', 'expectedWeeklyPocketMoney']);

/** Omit nannyType unless AIRTABLE_NANNIES_HAVE_NANNY_TYPE=true. */
const OMIT_NANNY_TYPE_UNLESS_IN_BASE = 'nannyType';

/**
 * Convert payload keys to Airtable field names. Keys not in the map are passed through as-is (camelCase).
 * Always omits euAuPairHoursAcknowledged and expectedWeeklyPocketMoney. Omits nannyType unless config says base has that column.
 */
export function nannyFieldsToAirtable(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const includeNannyType = config.airtable.nanniesHaveNannyTypeField;
  for (const [key, value] of Object.entries(fields)) {
    if (ALWAYS_OMIT.has(key)) continue;
    if (key === OMIT_NANNY_TYPE_UNLESS_IN_BASE && !includeNannyType) continue;
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
