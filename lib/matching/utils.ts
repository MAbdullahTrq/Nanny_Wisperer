/**
 * Shared matching utilities: array/field parsing and age-group normalization.
 * Used by lib/airtable/matching.ts, lib/matching/algorithm.ts, and lib/matching/filters.ts.
 */

/**
 * Normalize a value to an array (handles Airtable string, JSON string, or array).
 */
export function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* not JSON */
      }
    }
    return trimmed.split(',').map((s) => (s as string).trim()).filter(Boolean) as T[];
  }
  return [v];
}

/**
 * Age-group mapping: hosts use descriptive labels, nannies use age-range labels.
 * Both directions must be compared for a match.
 */
export const AGE_GROUP_MAP: Record<string, string[]> = {
  infant: ['0-2'],
  toddler: ['3-6'],
  'school age': ['7-12'],
  teen: ['teens'],
  '0-2': ['infant'],
  '3-6': ['toddler'],
  '7-12': ['school age'],
  teens: ['teen'],
};

export function normalizeAgeGroup(g: string): string[] {
  const lower = g.toLowerCase().trim();
  return [lower, ...(AGE_GROUP_MAP[lower] ?? [])];
}

/**
 * Count how many host age groups have at least one matching nanny group
 * (using normalized labels so e.g. "infant" matches "0-2").
 */
export function ageGroupsOverlap(hostGroups: string[], nannyGroups: string[]): number {
  const nannyNormalized = nannyGroups.flatMap(normalizeAgeGroup);
  let matched = 0;
  for (const hg of hostGroups) {
    const hostNorm = normalizeAgeGroup(hg);
    if (hostNorm.some((h) => nannyNormalized.includes(h))) matched++;
  }
  return matched;
}
