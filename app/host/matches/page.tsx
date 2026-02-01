import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getMatchesByHost } from '@/lib/airtable/matches';
import { getNanny } from '@/lib/airtable/nannies';
import { generateCvToken } from '@/lib/auth/tokens';
import { Card } from '@/components/ui';
import type { Match } from '@/types/airtable';
import type { Nanny } from '@/types/airtable';

function statusLabel(m: Match): string {
  if (m.status === 'passed') return 'Passed';
  if (m.hostProceed && m.nannyProceed) return 'Both Proceed';
  if (m.hostProceed) return 'You proceeded';
  if (m.nannyProceed) return 'Nanny proceeded';
  return 'Pending';
}

export default async function HostMatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/host/matches');

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const matches = airtableHostId ? await getMatchesByHost(airtableHostId) : [];

  const nannyMap = new Map<string, Nanny | null>();
  const nannyIds = Array.from(new Set(matches.map((m) => m.nannyId).filter(Boolean))) as string[];
  await Promise.all(
    nannyIds.map(async (id) => {
      const nanny = await getNanny(id);
      nannyMap.set(id, nanny);
    })
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Your matches
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Review nannies and open their CVs to Proceed or Pass.
      </p>

      {matches.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">No matches yet. Generate a shortlist from your dashboard.</p>
          <Link href="/host/dashboard" className="mt-3 inline-block text-dark-green font-medium hover:underline">
            Go to dashboard
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {matches.map((match) => {
            const nanny = match.nannyId ? nannyMap.get(match.nannyId) : null;
            const name = nanny
              ? [nanny.firstName, nanny.lastName].filter(Boolean).join(' ') || 'Nanny'
              : 'Nanny';
            const initial = name.charAt(0).toUpperCase();
            const cvToken =
              match.id && airtableHostId && match.nannyId
                ? generateCvToken(match.id, undefined, airtableHostId, match.nannyId)
                : '';
            return (
              <li key={match.id}>
                <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-light-green flex items-center justify-center text-dark-green font-semibold">
                      {initial}
                    </div>
                    <div>
                      <p className="font-medium text-pastel-black">{name}</p>
                      <p className="text-sm text-dark-green/80">
                        Match: {match.score ?? '—'}% · {statusLabel(match)}
                      </p>
                    </div>
                  </div>
                  {cvToken ? (
                    <Link
                      href={`/cv/${cvToken}`}
                      className="rounded-lg bg-dark-green text-off-white px-4 py-2 text-sm font-medium hover:bg-dark-green/90 transition-colors"
                    >
                      View CV
                    </Link>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
