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

function statusLabel(m: Match): { text: string; color: string } {
  if (m.status === 'passed') return { text: 'Passed', color: 'bg-red-100 text-red-700' };
  if (m.hostProceed && m.nannyProceed) return { text: 'Both Proceed', color: 'bg-emerald-100 text-emerald-700' };
  if (m.hostProceed) return { text: 'You proceeded', color: 'bg-blue-100 text-blue-700' };
  if (m.nannyProceed) return { text: 'Nanny proceeded', color: 'bg-blue-100 text-blue-700' };
  return { text: 'Pending', color: 'bg-amber-50 text-amber-700' };
}

function scoreColor(score: number | undefined): string {
  if (!score) return 'text-dark-green/60';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-dark-green';
  return 'text-amber-600';
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-pastel-black mb-1">
          Your matches
        </h1>
        <p className="text-dark-green/70 text-sm">
          Review nannies and open their CVs to Proceed or Pass.
        </p>
      </div>

      {matches.length === 0 ? (
        <Card className="!p-8 text-center">
          <p className="text-dark-green/70 mb-4">No matches yet. Generate a shortlist from your dashboard.</p>
          <Link
            href="/host/dashboard"
            className="inline-block rounded-lg bg-dark-green text-off-white px-5 py-2.5 text-sm font-medium hover:bg-dark-green/90 transition-colors"
          >
            Go to dashboard
          </Link>
        </Card>
      ) : (
        <ul className="space-y-4">
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
            const status = statusLabel(match);
            const score = typeof match.score === 'string' ? parseInt(match.score, 10) : match.score;
            const experience = nanny?.yearsChildcareExperience != null
              ? `${nanny.yearsChildcareExperience} yrs experience`
              : nanny?.hasChildcareExperience
                ? 'Childcare experience'
                : null;
            const location = nanny?.currentLocation || nanny?.city || null;

            return (
              <li key={match.id}>
                <Card>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar + Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-light-green flex items-center justify-center text-dark-green font-semibold text-lg shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-pastel-black text-base">{name}</p>
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-dark-green/70">
                          <span>{(nanny?.nannyType as string) ?? 'Nanny'}</span>
                          {experience && (
                            <>
                              <span className="text-light-green">·</span>
                              <span>{experience}</span>
                            </>
                          )}
                          {location && (
                            <>
                              <span className="text-light-green">·</span>
                              <span>{location}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className={`text-sm font-semibold ${scoreColor(score)}`}>
                            {score ?? '—'}% match
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    {cvToken && (
                      <div className="shrink-0 sm:self-center">
                        <Link
                          href={`/cv/${cvToken}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-dark-green text-off-white px-5 py-2.5 text-sm font-medium hover:bg-dark-green/90 transition-colors"
                        >
                          View CV
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
