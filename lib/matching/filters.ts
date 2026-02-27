/**
 * Must-match filters for host–nanny matching. T5.1.
 * If any fail, match score is 0 or candidate is excluded.
 */

import type { Host, Nanny } from '@/types/airtable';

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* not JSON */ }
    }
    return trimmed.split(',').map(s => (s as string).trim()).filter(Boolean) as T[];
  }
  return [v];
}

function locationMatch(host: Host, nanny: Nanny): boolean {
  const hostLoc = (host.location ?? host.jobLocationPlace ?? host.country ?? '').toString().toLowerCase();
  const nannyLoc = (nanny.location ?? nanny.currentLocation ?? nanny.country ?? '').toString().toLowerCase();
  if (!hostLoc || !nannyLoc) return true; // no requirement
  return hostLoc.includes(nannyLoc) || nannyLoc.includes(hostLoc);
}

function startDateMatch(host: Host, nanny: Nanny): boolean {
  const hostStart = host.desiredStartDate;
  const nannyStart = nanny.availableStartDate;
  if (!hostStart || !nannyStart) return true;
  try {
    const h = new Date(hostStart);
    const n = new Date(nannyStart);
    return n <= h || isNaN(n.getTime()) || isNaN(h.getTime());
  } catch {
    return true;
  }
}

function accommodationMatch(host: Host, nanny: Nanny): boolean {
  const hostAcc = host.accommodationType;
  const nannyAcc = (nanny as { accommodationPreference?: string }).accommodationPreference;
  if (!hostAcc) return true;
  if (hostAcc === 'Either') return true;
  if (!nannyAcc) return true;
  return hostAcc === nannyAcc || nannyAcc === 'Either';
}

function availabilityMatch(host: Host, nanny: Nanny): boolean {
  const hostDays = toArray(host.requiredDays).filter(Boolean);
  const nannyDays = toArray(nanny.availableDays).filter(Boolean);
  if (hostDays.length === 0 || nannyDays.length === 0) return true;
  const overlap = hostDays.filter((d) => nannyDays.includes(d));
  return overlap.length > 0;
}

const AGE_GROUP_MAP: Record<string, string[]> = {
  'infant': ['0-2'],
  'toddler': ['3-6'],
  'school age': ['7-12'],
  'teen': ['teens'],
  '0-2': ['infant'],
  '3-6': ['toddler'],
  '7-12': ['school age'],
  'teens': ['teen'],
};

function normalizeAgeGroup(g: string): string[] {
  const lower = g.toLowerCase().trim();
  return [lower, ...(AGE_GROUP_MAP[lower] ?? [])];
}

function ageGroupMatch(host: Host, nanny: Nanny): boolean {
  const hostGroups = toArray(host.ageGroupExperienceRequired).map((g) => String(g));
  const nannyGroups = toArray(nanny.ageGroupsWorkedWith).map((g) => String(g));
  if (hostGroups.length === 0) return true;
  if (nannyGroups.length === 0) return false;
  const nannyNormalized = nannyGroups.flatMap(normalizeAgeGroup);
  const allMatch = hostGroups.every((hg) => {
    const hostNorm = normalizeAgeGroup(hg);
    return hostNorm.some(h => nannyNormalized.includes(h));
  });
  return allMatch;
}

function specialNeedsMatch(host: Host, nanny: Nanny): boolean {
  if (!host.specialNeedsCare) return true;
  return Boolean(nanny.specialNeedsExperience);
}

/**
 * Returns true only if all must-match filters pass.
 */
export function passesMustMatchFilters(host: Host, nanny: Nanny): boolean {
  return (
    locationMatch(host, nanny) &&
    startDateMatch(host, nanny) &&
    accommodationMatch(host, nanny) &&
    availabilityMatch(host, nanny) &&
    ageGroupMatch(host, nanny) &&
    specialNeedsMatch(host, nanny)
  );
}
