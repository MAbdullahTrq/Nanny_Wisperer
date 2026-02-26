import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getShortlist } from '@/lib/airtable/shortlists';
import { getMatch } from '@/lib/airtable/matches';
import { getNanny } from '@/lib/airtable/nannies';
import { generateCvToken } from '@/lib/auth/tokens';
import { Card } from '@/components/ui';
import type { Nanny } from '@/types/airtable';

export default async function HostShortlistViewPage({
  params,
}: {
  params: { shortlistId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) notFound();

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const userType = (session.user as { userType?: string }).userType;
  if (userType !== 'Host' || !airtableHostId) notFound();

  const shortlistId = params.shortlistId;
  if (!shortlistId) notFound();

  const shortlist = await getShortlist(shortlistId);
  if (!shortlist || shortlist.hostId !== airtableHostId) notFound();
  if (!shortlist.matchIds?.length) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
          Your nanny shortlist
        </h1>
        <p className="text-dark-green/80 text-sm mb-6">This shortlist has no profiles yet.</p>
        <Link href="/host/shortlists" className="text-dark-green font-medium hover:underline">
          ← Back to shortlists
        </Link>
      </div>
    );
  }

  const hostId = shortlist.hostId ?? airtableHostId;
  const matchesAndNannies: Array<{ matchId: string; score?: number; nanny: Nanny }> = [];

  for (const matchId of shortlist.matchIds) {
    const match = await getMatch(matchId);
    if (!match?.nannyId) continue;
    const nanny = await getNanny(match.nannyId);
    if (!nanny) continue;
    matchesAndNannies.push({ matchId, score: match.score, nanny });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
            Your nanny shortlist
          </h1>
          <p className="text-dark-green/80 text-sm">
            {matchesAndNannies.length} nanny {matchesAndNannies.length === 1 ? 'profile' : 'profiles'}{' '}
            to review.
          </p>
        </div>
        <Link
          href="/host/shortlists"
          className="text-sm text-dark-green font-medium hover:underline"
        >
          ← Back to shortlists
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {matchesAndNannies.map(({ matchId, score, nanny }) => {
          const cvToken = generateCvToken(matchId, shortlistId, hostId, nanny.id);
          const name = [nanny.firstName, nanny.lastName].filter(Boolean).join(' ') || 'Nanny';
          const initial = name.charAt(0).toUpperCase();
          const experience =
            nanny.yearsChildcareExperience != null
              ? `${nanny.yearsChildcareExperience} years experience`
              : nanny.hasChildcareExperience
                ? 'Childcare experience'
                : '—';
          return (
            <Card key={matchId} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-light-green flex items-center justify-center text-dark-green font-semibold text-lg shrink-0">
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
                  className="rounded-lg bg-dark-green text-off-white px-4 py-2 text-sm font-medium hover:bg-dark-green/90 transition-colors shrink-0 text-center"
                >
                  View full CV
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
