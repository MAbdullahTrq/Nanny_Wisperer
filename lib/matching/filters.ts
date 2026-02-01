/**
 * Must-match filters for host–nanny matching. T5.1.
 * If any fail, match score is 0 or candidate is excluded.
 */

import type { Host, Nanny } from '@/types/airtable';

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
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

function ageGroupMatch(host: Host, nanny: Nanny): boolean {
  const hostGroups = toArray(host.ageGroupExperienceRequired).map((g) => String(g).toLowerCase());
  const nannyGroups = toArray(nanny.ageGroupsWorkedWith).map((g) => String(g).toLowerCase());
  if (hostGroups.length === 0) return true;
  if (nannyGroups.length === 0) return false;
  const allMatch = hostGroups.every((hg) =>
    nannyGroups.some((ng) => ng.includes(hg) || hg.includes(ng))
  );
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
