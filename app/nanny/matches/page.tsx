import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getMatchesByNanny } from '@/lib/airtable/matches';
import { getHost } from '@/lib/airtable/hosts';
import { generateCvToken } from '@/lib/auth/tokens';
import { Card } from '@/components/ui';
import type { Match } from '@/types/airtable';
import type { Host } from '@/types/airtable';

function statusLabel(m: Match): string {
  if (m.status === 'passed') return 'Passed';
  if (m.hostProceed && m.nannyProceed) return 'Both Proceed';
  if (m.hostProceed) return 'Host proceeded';
  if (m.nannyProceed) return 'You proceeded';
  return 'Pending';
}

function hostSummary(host: Host | null): string {
  if (!host) return '—';
  const parts: string[] = [];
  const loc = host.jobLocationPlace ?? host.city ?? host.country ?? host.location;
  if (loc) parts.push(String(loc));
  if (host.childrenAndAges) parts.push(host.childrenAndAges);
  return parts.length ? parts.join(' · ') : '—';
}

export default async function NannyMatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/nanny/matches');

  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const matches = airtableNannyId ? await getMatchesByNanny(airtableNannyId) : [];

  const hostMap = new Map<string, Host | null>();
  const hostIds = Array.from(new Set(matches.map((m) => m.hostId).filter(Boolean))) as string[];
  await Promise.all(
    hostIds.map(async (id) => {
      const host = await getHost(id);
      hostMap.set(id, host);
    })
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Where you&apos;ve been shortlisted
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Families who shortlisted you. View your CV as they see it.
      </p>

      {matches.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">You haven&apos;t been shortlisted yet. Complete your profile to appear in matches.</p>
          <Link href="/nanny/onboarding" className="mt-3 inline-block text-dark-green font-medium hover:underline">
            Go to onboarding
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {matches.map((match) => {
            const host = match.hostId ? hostMap.get(match.hostId) ?? null : null;
            const summary = hostSummary(host);
            const cvToken =
              match.id && match.hostId && airtableNannyId
                ? generateCvToken(match.id, undefined, match.hostId, airtableNannyId)
                : '';
            return (
              <li key={match.id}>
                <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-pastel-black">Family: {summary}</p>
                    <p className="text-sm text-dark-green/80 mt-1">
                      Match: {match.score ?? '—'}% · {statusLabel(match)}
                    </p>
                  </div>
                  {cvToken ? (
                    <Link
                      href={`/cv/${cvToken}`}
                      className="rounded-lg bg-dark-green text-off-white px-4 py-2 text-sm font-medium hover:bg-dark-green/90 transition-colors"
                    >
                      View my CV as they see it
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
