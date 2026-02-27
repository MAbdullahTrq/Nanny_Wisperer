/**
 * 100-point match scoring. T5.1 — Core 40, Skills 20, Values 20, Bonus 20.
 */

import type { Host, Nanny } from '@/types/airtable';
import { passesMustMatchFilters } from './filters';

const CORE_MAX = 40;
const SKILLS_MAX = 20;
const VALUES_MAX = 20;
const BONUS_MAX = 20;

export interface MatchScoreResult {
  total: number;
  core: number;
  skills: number;
  values: number;
  bonus: number;
}

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

function coreScore(host: Host, nanny: Nanny): number {
  let s = 0;
  const hostLoc = (host.location ?? host.jobLocationPlace ?? host.country ?? '').toString().toLowerCase();
  const nannyLoc = (nanny.location ?? nanny.currentLocation ?? nanny.country ?? '').toString().toLowerCase();
  if (hostLoc && nannyLoc) {
    if (hostLoc === nannyLoc) s += 10;
    else if (hostLoc.includes(nannyLoc) || nannyLoc.includes(hostLoc)) s += 7;
  }

  if (host.desiredStartDate && nanny.availableStartDate) {
    try {
      const h = new Date(host.desiredStartDate);
      const n = new Date(nanny.availableStartDate);
      if (n <= h) s += 5;
    } catch {
      /* ignore */
    }
  }

  const hostAcc = host.accommodationType;
  const nannyAcc = (nanny as { accommodationPreference?: string }).accommodationPreference;
  if (hostAcc && nannyAcc && (hostAcc === nannyAcc || hostAcc === 'Either' || nannyAcc === 'Either')) s += 5;

  const hostDays = toArray(host.requiredDays).filter(Boolean);
  const nannyDays = toArray(nanny.availableDays).filter(Boolean);
  if (hostDays.length && nannyDays.length) {
    const overlap = hostDays.filter((d) => nannyDays.includes(d));
    s += Math.round(10 * (overlap.length / hostDays.length));
  }

  const hostGroups = toArray(host.ageGroupExperienceRequired).map(String);
  const nannyGroups = toArray(nanny.ageGroupsWorkedWith).map(String);
  if (hostGroups.length && nannyGroups.length) {
    const AGE_MAP: Record<string, string[]> = {
      'infant': ['0-2'], 'toddler': ['3-6'], 'school age': ['7-12'], 'teen': ['teens'],
      '0-2': ['infant'], '3-6': ['toddler'], '7-12': ['school age'], 'teens': ['teen'],
    };
    const normalize = (g: string) => { const l = g.toLowerCase().trim(); return [l, ...(AGE_MAP[l] ?? [])]; };
    const nannyNorm = nannyGroups.flatMap(normalize);
    const matchCount = hostGroups.filter((hg) => normalize(hg).some(h => nannyNorm.includes(h))).length;
    s += hostGroups.length === matchCount ? 10 : Math.round(10 * (matchCount / hostGroups.length));
  }

  return Math.min(s, CORE_MAX);
}

function skillsScore(host: Host, nanny: Nanny): number {
  let match = 0;
  let total = 0;
  if (host.cookingForChildren) {
    total += 1;
    if (nanny.canCook) match += 1;
  }
  if (host.tutoringHomework) {
    total += 1;
    if (nanny.tutoringHomework) match += 1;
  }
  if (host.driving) {
    total += 1;
    if (nanny.hasDrivingLicence) match += 1;
  }
  if (host.travelAssistance) {
    total += 1;
    if (nanny.okToTravelAndSupport) match += 1;
  }
  if (host.lightHousekeeping) {
    total += 1;
    if (nanny.lightHousekeeping) match += 1;
  }
  if (total === 0) return SKILLS_MAX;
  return Math.round((match / total) * SKILLS_MAX);
}

function valuesScore(host: Host, nanny: Nanny): number {
  let s = 0;
  if (host.parentingStyle && nanny.parentingStylePreference) {
    s += host.parentingStyle === nanny.parentingStylePreference ? 5 : 2;
  }
  if (host.petsInHome !== undefined && nanny.comfortableWithPets !== undefined) {
    s += host.petsInHome === nanny.comfortableWithPets ? 5 : 0;
  }
  if (host.smokingPolicy && host.smokingPolicy === 'No smoking' && nanny.smokes) {
    s -= 5;
  } else if (host.smokingPolicy && nanny.smokes === false) {
    s += 5;
  }
  if (host.strongReligiousBeliefs !== undefined && nanny.strongReligiousBeliefs !== undefined) {
    s += host.strongReligiousBeliefs === nanny.strongReligiousBeliefs ? 5 : 2;
  }
  return Math.max(0, Math.min(s, VALUES_MAX));
}

function bonusScore(host: Host, nanny: Nanny): number {
  let s = 0;
  if (host.primaryLanguageRequired && nanny.languageSkills) {
    const nannyLangs = typeof nanny.languageSkills === 'string'
      ? nanny.languageSkills.toLowerCase()
      : Object.keys(nanny.languageSkills).join(' ').toLowerCase();
    if (nannyLangs.includes(host.primaryLanguageRequired.toLowerCase())) s += 10;
  }
  if (host.monthlySalaryRange && nanny.expectedMonthlySalaryNet != null) {
    s += 5;
  }
  const badge = nanny.badge ?? nanny.tier;
  if (badge === 'Certified') s += 5;
  else if (badge === 'Verified') s += 3;
  return Math.min(s, BONUS_MAX);
}

/**
 * Compute 100-point match score. Does not check must-match; caller should filter first.
 */
export function computeMatchScore(host: Host, nanny: Nanny): MatchScoreResult {
  const core = coreScore(host, nanny);
  const skills = skillsScore(host, nanny);
  const values = valuesScore(host, nanny);
  const bonus = bonusScore(host, nanny);
  const total = core + skills + values + bonus;
  return { total, core, skills, values, bonus };
}

/**
 * Get eligible nannies for a host: must-match pass, then scored and sorted by total (desc).
 * Respects host tier: VIP sees Certified + Verified + Basic; others see Verified + Basic.
 */
export async function getEligibleNannies(
  host: Host,
  options?: { minScore?: number; maxCandidates?: number }
): Promise<Array<{ nanny: Nanny; score: MatchScoreResult }>> {
  const { getHost } = await import('@/lib/airtable/hosts');
  const { getNannies, getNanniesByTier } = await import('@/lib/airtable/nannies');

  const hostId = host.id;
  const resolvedHost = hostId ? await getHost(hostId) : host;
  const h = resolvedHost ?? host;

  let nannies: Nanny[];
  if (h.tier === 'VIP') {
    const [certified, verified, basic] = await Promise.all([
      getNanniesByTier('Certified'),
      getNanniesByTier('Verified'),
      getNanniesByTier('Basic'),
    ]);
    nannies = [...certified, ...verified, ...basic];
  } else {
    const [verified, basic] = await Promise.all([
      getNanniesByTier('Verified'),
      getNanniesByTier('Basic'),
    ]);
    nannies = [...verified, ...basic];
  }

  const minScore = options?.minScore ?? 60;
  const results: Array<{ nanny: Nanny; score: MatchScoreResult }> = [];

  for (const nanny of nannies) {
    if (!passesMustMatchFilters(h, nanny)) continue;
    const score = computeMatchScore(h, nanny);
    if (score.total < minScore) continue;
    results.push({ nanny, score });
  }

  results.sort((a, b) => {
    if (a.score.total !== b.score.total) return b.score.total - a.score.total;
    const tierOrder = { Certified: 3, Verified: 2, Basic: 1 };
    const ta = tierOrder[(a.nanny.badge ?? a.nanny.tier) as keyof typeof tierOrder] ?? 0;
    const tb = tierOrder[(b.nanny.badge ?? b.nanny.tier) as keyof typeof tierOrder] ?? 0;
    return tb - ta;
  });

  const max = options?.maxCandidates ?? 100;
  return results.slice(0, max);
}
