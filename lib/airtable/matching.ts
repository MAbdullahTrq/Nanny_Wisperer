import { getAllHosts } from './hosts';
import { getAllNannies, getNanniesByTier } from './nannies';
import { createMatch } from './matches';
import { createShortlist } from './shortlists';
import { MATCH_SCORING, MATCH_THRESHOLDS, TIER_PRIORITY } from '@/config/constants';
import type { Host, Nanny, Match } from '@/types/airtable';

export interface MatchScore {
  total: number;
  core: number;
  skills: number;
  values: number;
  bonus: number;
}

/**
 * Age-group mapping: hosts use descriptive labels, nannies use age-range labels.
 * Both directions must be compared for a match.
 */
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

function ageGroupsOverlap(hostGroups: string[], nannyGroups: string[]): number {
  const nannyNormalized = nannyGroups.flatMap(normalizeAgeGroup);
  let matched = 0;
  for (const hg of hostGroups) {
    const hostNorm = normalizeAgeGroup(hg);
    if (hostNorm.some(h => nannyNormalized.includes(h))) matched++;
  }
  return matched;
}

function resolveLocation(record: Host | Nanny): string {
  return (
    (record as Host).location ??
    (record as Host).jobLocationPlace ??
    (record as Nanny).currentLocation ??
    record.city ??
    record.country ??
    ''
  ).toString().toLowerCase().trim();
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

/**
 * Calculate match score between host and nanny
 */
export function calculateMatchScore(host: Host, nanny: Nanny): MatchScore {
  let coreScore = 0;
  let skillsScore = 0;
  let valuesScore = 0;
  let bonusScore = 0;

  // Core Filters (40 points)
  // Location match (10 points)
  const hostLoc = resolveLocation(host);
  const nannyLoc = resolveLocation(nanny);
  if (hostLoc && nannyLoc) {
    if (hostLoc === nannyLoc) {
      coreScore += 10;
    } else if (hostLoc.includes(nannyLoc) || nannyLoc.includes(hostLoc)) {
      coreScore += 7;
    }
  }

  // Start date compatibility (5 points)
  if (host.desiredStartDate && nanny.availableStartDate) {
    try {
      const hostStart = new Date(host.desiredStartDate);
      const nannyStart = new Date(nanny.availableStartDate);
      if (nannyStart <= hostStart) {
        coreScore += 5;
      }
    } catch { /* ignore */ }
  }

  // Live-in/out preference (5 points)
  if (host.accommodationType) {
    if (host.accommodationType === 'Either') {
      coreScore += 5;
    }
  }

  // Availability match (10 points)
  const hostDays = toArray(host.requiredDays).filter(Boolean);
  const nannyDays = toArray(nanny.availableDays).filter(Boolean);
  if (hostDays.length && nannyDays.length) {
    const overlap = hostDays.filter(day => nannyDays.includes(day));
    coreScore += Math.round(10 * (overlap.length / hostDays.length));
  }

  // Age group experience (10 points)
  const hostGroups = toArray(host.ageGroupExperienceRequired).filter(Boolean).map(String);
  const nannyGroups = toArray(nanny.ageGroupsWorkedWith).filter(Boolean).map(String);
  if (hostGroups.length && nannyGroups.length) {
    const matchCount = ageGroupsOverlap(hostGroups, nannyGroups);
    if (matchCount === hostGroups.length) {
      coreScore += 10;
    } else if (matchCount > 0) {
      coreScore += Math.round(10 * (matchCount / hostGroups.length));
    }
  }

  // Skills & Responsibilities (20 points)
  let skillsMatchCount = 0;
  let skillsTotal = 0;

  if (host.cookingForChildren) { skillsTotal++; if (nanny.canCook) skillsMatchCount++; }
  if (host.tutoringHomework) { skillsTotal++; if (nanny.tutoringHomework) skillsMatchCount++; }
  if (host.driving) { skillsTotal++; if (nanny.hasDrivingLicence) skillsMatchCount++; }
  if (host.travelAssistance) { skillsTotal++; if (nanny.okToTravelAndSupport) skillsMatchCount++; }
  if (host.lightHousekeeping) { skillsTotal++; if (nanny.lightHousekeeping) skillsMatchCount++; }

  if (skillsTotal > 0) {
    skillsScore = Math.round((skillsMatchCount / skillsTotal) * MATCH_SCORING.SKILLS);
  }

  // Values & Lifestyle (20 points)
  if (host.parentingStyle && nanny.parentingStylePreference) {
    valuesScore += host.parentingStyle === nanny.parentingStylePreference ? 5 : 2;
  }

  if (host.petsInHome !== undefined && nanny.comfortableWithPets !== undefined) {
    if (host.petsInHome === nanny.comfortableWithPets) valuesScore += 5;
  }

  if (host.smokingPolicy === 'No smoking' && nanny.smokes) {
    valuesScore -= 5;
  } else if (host.smokingPolicy && nanny.smokes === false) {
    valuesScore += 5;
  }

  if (host.strongReligiousBeliefs !== undefined && nanny.strongReligiousBeliefs !== undefined) {
    valuesScore += host.strongReligiousBeliefs === nanny.strongReligiousBeliefs ? 5 : 2;
  }

  valuesScore = Math.max(0, Math.min(valuesScore, MATCH_SCORING.VALUES));

  // Bonus (20 points)
  if (host.primaryLanguageRequired && nanny.languageSkills) {
    const nannyLangs = typeof nanny.languageSkills === 'string'
      ? nanny.languageSkills.toLowerCase()
      : Object.keys(nanny.languageSkills).join(' ').toLowerCase();
    if (nannyLangs.includes(host.primaryLanguageRequired.toLowerCase())) {
      bonusScore += 10;
    }
  }

  if (host.monthlySalaryRange && nanny.expectedMonthlySalaryNet != null) {
    bonusScore += 5;
  }

  const badge = nanny.badge ?? nanny.tier;
  if (badge === 'Certified') bonusScore += 5;
  else if (badge === 'Verified') bonusScore += 3;

  bonusScore = Math.min(bonusScore, MATCH_SCORING.BONUS);

  const totalScore = coreScore + skillsScore + valuesScore + bonusScore;

  return {
    total: totalScore,
    core: coreScore,
    skills: skillsScore,
    values: valuesScore,
    bonus: bonusScore,
  };
}

/**
 * Check if match passes must-match filters
 */
export function passesMustMatchFilters(host: Host, nanny: Nanny): boolean {
  const hostLoc = resolveLocation(host);
  const nannyLoc = resolveLocation(nanny);
  if (hostLoc && nannyLoc) {
    if (!hostLoc.includes(nannyLoc) && !nannyLoc.includes(hostLoc)) {
      return false;
    }
  }

  const hostDays = toArray(host.requiredDays).filter(Boolean);
  const nannyDays = toArray(nanny.availableDays).filter(Boolean);
  if (hostDays.length > 0 && nannyDays.length > 0) {
    if (!hostDays.some(d => nannyDays.includes(d))) return false;
  }

  const hostGroups = toArray(host.ageGroupExperienceRequired).filter(Boolean).map(String);
  const nannyGroups = toArray(nanny.ageGroupsWorkedWith).filter(Boolean).map(String);
  if (hostGroups.length > 0 && nannyGroups.length > 0) {
    if (ageGroupsOverlap(hostGroups, nannyGroups) === 0) return false;
  }

  if (host.specialNeedsCare && !nanny.specialNeedsExperience) {
    return false;
  }

  return true;
}

/**
 * Find matches for a host
 */
export async function findMatchesForHost(hostId: string): Promise<Array<{ nanny: Nanny; score: MatchScore }>> {
  const host = await getAllHosts().then(hosts => hosts.find(h => h.id === hostId));
  if (!host) {
    throw new Error('Host not found');
  }

  let nannies: Nanny[];
  if (host.tier === 'VIP') {
    const certified = await getNanniesByTier('Certified');
    const verified = await getNanniesByTier('Verified');
    const basic = await getNanniesByTier('Basic');
    nannies = [...certified, ...verified, ...basic];
  } else {
    const verified = await getNanniesByTier('Verified');
    const basic = await getNanniesByTier('Basic');
    nannies = [...verified, ...basic];
  }

  // Fallback: if tier-based filtering returns no nannies, fetch all
  if (nannies.length === 0) {
    nannies = await getAllNannies();
  }

  const matches: Array<{ nanny: Nanny; score: MatchScore }> = [];

  for (const nanny of nannies) {
    if (!passesMustMatchFilters(host, nanny)) {
      continue;
    }

    const score = calculateMatchScore(host, nanny);

    if (score.total >= MATCH_THRESHOLDS.REVIEW) {
      matches.push({ nanny, score });
    }
  }

  matches.sort((a, b) => {
    if (a.score.total !== b.score.total) {
      return b.score.total - a.score.total;
    }
    const tierPriority = { Certified: 3, Verified: 2, Basic: 1 };
    return (tierPriority[b.nanny.tier as keyof typeof tierPriority] || 0) -
           (tierPriority[a.nanny.tier as keyof typeof tierPriority] || 0);
  });

  return matches;
}

/**
 * Create matches and shortlist for a host
 */
export async function createMatchesAndShortlist(hostId: string): Promise<string> {
  const matches = await findMatchesForHost(hostId);

  const matchIds: string[] = [];
  for (const { nanny, score } of matches.slice(0, 10)) {
    const match = await createMatch({
      hostId,
      nannyId: nanny.id || '',
      score: score.total,
      status: 'pending',
    });
    matchIds.push(match.id!);
  }

  const shortlist = await createShortlist({
    hostId,
    matchIds,
  });

  return shortlist.id!;
}
