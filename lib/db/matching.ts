/**
 * Matching: single implementation lives in lib/matching/ (algorithm, filters, shortlist).
 * This module re-exports for backwards compatibility. Prefer importing from '@/lib/matching/shortlist' and '@/lib/matching/algorithm'.
 */

import type { MatchScoreResult } from '@/lib/matching/algorithm';
import { createShortlistForHost } from '@/lib/matching/shortlist';

export type MatchScore = MatchScoreResult;

/** @deprecated Use createShortlistForHost from '@/lib/matching/shortlist'. */
export const createMatchesAndShortlist = createShortlistForHost;
