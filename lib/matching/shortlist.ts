/**
 * Shortlist creation for a host. T5.2 — getEligibleNannies, create Match records, create Shortlist.
 */

import { getHost } from '@/lib/airtable/hosts';
import { createMatch } from '@/lib/airtable/matches';
import { createShortlist } from '@/lib/airtable/shortlists';
import { getEligibleNannies } from './algorithm';

const TOP_N = 10;

/**
 * Create Match records for top N eligible nannies and one Shortlist record.
 * Returns shortlist id.
 */
export async function createShortlistForHost(hostId: string): Promise<string> {
  const host = await getHost(hostId);
  if (!host) throw new Error('Host not found');

  const eligible = await getEligibleNannies(host, {
    minScore: 60,
    maxCandidates: TOP_N,
  });

  const matchIds: string[] = [];
  for (const { nanny, score } of eligible.slice(0, TOP_N)) {
    if (!nanny.id) continue;
    const match = await createMatch({
      hostId,
      nannyId: nanny.id,
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
