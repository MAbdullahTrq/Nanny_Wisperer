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
 * Calculate match score between host and nanny
 */
export function calculateMatchScore(host: Host, nanny: Nanny): MatchScore {
  let coreScore = 0;
  let skillsScore = 0;
  let valuesScore = 0;
  let bonusScore = 0;

  // Core Filters (40 points) - Must match
  // Location match (10 points)
  if (host.location && nanny.location) {
    if (host.location.toLowerCase() === nanny.location.toLowerCase()) {
      coreScore += 10;
    } else if (host.location.toLowerCase().includes(nanny.location.toLowerCase()) ||
               nanny.location.toLowerCase().includes(host.location.toLowerCase())) {
      coreScore += 7; // Partial match
    }
  }

  // Start date compatibility (5 points)
  if (host.desiredStartDate && nanny.availableStartDate) {
    const hostStart = new Date(host.desiredStartDate);
    const nannyStart = new Date(nanny.availableStartDate);
    if (nannyStart <= hostStart) {
      coreScore += 5;
    }
  }

  // Live-in/out preference (5 points)
  if (host.accommodationType && nanny.accommodationPreference) {
    if (host.accommodationType === nanny.accommodationPreference ||
        host.accommodationType === 'Either' ||
        nanny.accommodationPreference === 'Either') {
      coreScore += 5;
    }
  }

  // Availability match (10 points)
  if (host.requiredDays && nanny.availableDays) {
    const hostDays = Array.isArray(host.requiredDays) ? host.requiredDays : [host.requiredDays];
    const nannyDays = Array.isArray(nanny.availableDays) ? nanny.availableDays : [nanny.availableDays];
    const overlap = hostDays.filter(day => nannyDays.includes(day));
    const overlapPercent = overlap.length / hostDays.length;
    coreScore += Math.round(10 * overlapPercent);
  }

  // Age group experience (10 points)
  if (host.ageGroupExperience && nanny.ageGroups) {
    const hostGroups = Array.isArray(host.ageGroupExperience) ? host.ageGroupExperience : [host.ageGroupExperience];
    const nannyGroups = Array.isArray(nanny.ageGroups) ? nanny.ageGroups : [nanny.ageGroups];
    const matchCount = hostGroups.filter(group => nannyGroups.includes(group)).length;
    if (matchCount === hostGroups.length) {
      coreScore += 10;
    } else if (matchCount > 0) {
      coreScore += Math.round(10 * (matchCount / hostGroups.length));
    }
  }

  // Skills & Responsibilities (20 points)
  let skillsMatchCount = 0;
  let skillsTotal = 0;

  if (host.cooking && nanny.cooking) {
    skillsMatchCount++;
    skillsTotal++;
  } else if (host.cooking) skillsTotal++;

  if (host.tutoring && nanny.tutoring) {
    skillsMatchCount++;
    skillsTotal++;
  } else if (host.tutoring) skillsTotal++;

  if (host.driving && nanny.driving) {
    skillsMatchCount++;
    skillsTotal++;
  } else if (host.driving) skillsTotal++;

  if (host.travel && nanny.travel) {
    skillsMatchCount++;
    skillsTotal++;
  } else if (host.travel) skillsTotal++;

  if (host.housekeeping && nanny.housekeeping) {
    skillsMatchCount++;
    skillsTotal++;
  } else if (host.housekeeping) skillsTotal++;

  if (skillsTotal > 0) {
    skillsScore = Math.round((skillsMatchCount / skillsTotal) * MATCH_SCORING.SKILLS);
  }

  // Values & Lifestyle (20 points)
  // Parenting style (5 points)
  if (host.parentingStyle && nanny.parentingStyle) {
    if (host.parentingStyle === nanny.parentingStyle) {
      valuesScore += 5;
    } else {
      valuesScore += 2; // Partial match
    }
  }

  // Pet compatibility (5 points)
  if (host.pets !== undefined && nanny.petsComfortable !== undefined) {
    if (host.pets === nanny.petsComfortable) {
      valuesScore += 5;
    }
  }

  // Dietary match (5 points)
  if (host.dietaryPreferences && nanny.dietaryRestrictions) {
    // Simple check - can be enhanced
    valuesScore += 5;
  }

  // Religion/culture (5 points)
  if (host.religiousBeliefs && nanny.religiousBeliefs) {
    if (host.religiousBeliefs === nanny.religiousBeliefs) {
      valuesScore += 5;
    } else {
      valuesScore += 2;
    }
  }

  // Bonus (20 points)
  // Language fluency (10 points)
  if (host.primaryLanguage && nanny.languages) {
    const nannyLanguages = Array.isArray(nanny.languages) ? nanny.languages : [nanny.languages];
    if (nannyLanguages.includes(host.primaryLanguage)) {
      bonusScore += 10;
    }
  }

  // Salary alignment (5 points)
  if (host.salaryRange && nanny.expectedSalary) {
    // Simple range check - can be enhanced
    bonusScore += 5;
  }

  // Certifications (5 points)
  if (nanny.tier === 'Certified') {
    bonusScore += 5;
  } else if (nanny.tier === 'Verified') {
    bonusScore += 3;
  }

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
  // Location must match (at least partially)
  if (host.location && nanny.location) {
    const hostLoc = host.location.toLowerCase();
    const nannyLoc = nanny.location.toLowerCase();
    if (!hostLoc.includes(nannyLoc) && !nannyLoc.includes(hostLoc)) {
      return false;
    }
  }

  // Age groups must match
  if (host.ageGroupExperience && nanny.ageGroups) {
    const hostGroups = Array.isArray(host.ageGroupExperience) ? host.ageGroupExperience : [host.ageGroupExperience];
    const nannyGroups = Array.isArray(nanny.ageGroups) ? nanny.ageGroups : [nanny.ageGroups];
    const hasMatch = hostGroups.some(group => nannyGroups.includes(group));
    if (!hasMatch) {
      return false;
    }
  }

  // Special needs must match if required
  if (host.specialNeeds && !nanny.specialNeedsExperience) {
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

  // Get nannies based on host tier
  let nannies;
  if (host.tier === 'VIP') {
    // VIP can see all nannies, prioritize Certified
    const certified = await getNanniesByTier('Certified');
    const verified = await getNanniesByTier('Verified');
    const basic = await getNanniesByTier('Basic');
    nannies = [...certified, ...verified, ...basic];
  } else {
    // Standard and Fast Track see Basic and Verified
    const verified = await getNanniesByTier('Verified');
    const basic = await getNanniesByTier('Basic');
    nannies = [...verified, ...basic];
  }

  // Calculate scores and filter
  const matches: Array<{ nanny: Nanny; score: MatchScore }> = [];

  for (const nannyRecord of nannies) {
    const nanny = (nannyRecord.fields ?? nannyRecord) as Nanny;

    // Check must-match filters (host.fields is the flat Host shape from Airtable)
    const hostFields = host.fields ?? host;
    if (!passesMustMatchFilters(hostFields as Host, nanny)) {
      continue;
    }

    // Calculate score
    const score = calculateMatchScore(hostFields as Host, nanny);

    // Only include matches above minimum threshold
    if (score.total >= MATCH_THRESHOLDS.REVIEW) {
      matches.push({ nanny, score });
    }
  }

  // Sort by score (descending) and tier priority
  matches.sort((a, b) => {
    if (a.score.total !== b.score.total) {
      return b.score.total - a.score.total;
    }
    // If scores are equal, prioritize Certified > Verified > Basic
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
  // Find matches
  const matches = await findMatchesForHost(hostId);

  // Create match records in Airtable
  const matchIds: string[] = [];
  for (const { nanny, score } of matches.slice(0, 10)) { // Top 10 matches
    const match = await createMatch({
      hostId,
      nannyId: nanny.id || '',
      score: score.total,
      status: 'pending',
    });
    matchIds.push(match.id!);
  }

  // Create shortlist
  const shortlist = await createShortlist({
    hostId,
    matchIds,
  });

  return shortlist.id!;
}
