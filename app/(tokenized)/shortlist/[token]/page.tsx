import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { validateToken, generateCvToken } from '@/lib/auth/tokens';
import { getShortlist } from '@/lib/airtable/shortlists';
import { getMatch } from '@/lib/airtable/matches';
import { getNanny } from '@/lib/airtable/nannies';
import { Card } from '@/components/ui';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { token: string };
}

export default async function ShortlistTokenPage({ params }: PageProps) {
  const payload = validateToken(params.token);
  if (!payload || payload.type !== 'shortlist' || !payload.shortlistId) {
    notFound();
  }

  const shortlist = await getShortlist(payload.shortlistId);
  if (!shortlist || !shortlist.matchIds?.length) {
    notFound();
  }

  const hostId = shortlist.hostId ?? payload.hostId;
  type NannyItem = import('@/types/airtable').Nanny;
  const matchesAndNannies: Array<{ matchId: string; score?: number; nanny: NannyItem }> = [];

  for (const matchId of shortlist.matchIds) {
    const match = await getMatch(matchId);
    if (!match?.nannyId) continue;
    const nanny = await getNanny(match.nannyId);
    if (!nanny) continue;
    matchesAndNannies.push({ matchId, score: match.score, nanny });
  }

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
          Your nanny shortlist
        </h1>
        <p className="text-dark-green/80 text-sm mb-6">
          {matchesAndNannies.length} nanny {matchesAndNannies.length === 1 ? 'profile' : 'profiles'} to review.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {matchesAndNannies.map(({ matchId, score, nanny }) => {
            const cvToken = generateCvToken(matchId, payload.shortlistId, hostId, nanny.id);
            const name = [nanny.firstName, nanny.lastName].filter(Boolean).join(' ') || 'Nanny';
            const initial = name.charAt(0).toUpperCase();
            const experience = nanny.yearsChildcareExperience != null
              ? `${nanny.yearsChildcareExperience} years experience`
              : nanny.hasChildcareExperience
                ? 'Childcare experience'
                : '—';
            return (
              <Card key={matchId} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-light-green flex items-center justify-center text-dark-green font-semibold text-lg">
                      {initial}
                    </div>
                    <div>
                      <p className="font-medium text-pastel-black">{name}</p>
                      <p className="text-sm text-dark-green/80">{experience}</p>
                      {score != null && (
                        <p className="text-sm text-dark-green mt-1">
                          Match: <strong>{score}%</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/cv/${cvToken}`}
                    className="rounded-lg bg-dark-green text-off-white px-4 py-2 text-sm font-medium hover:bg-dark-green/90 transition-colors"
                  >
                    View full CV
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-dark-green/60">
          Links expire after 7 days. Contact your coordinator if you need a new link.
        </p>
      </div>
    </div>
  );
}
