import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getShortlistsByHost } from '@/lib/airtable/shortlists';
import { generateShortlistToken } from '@/lib/auth/tokens';
import { Card } from '@/components/ui';

function formatDate(createdTime?: string): string {
  if (!createdTime) return '—';
  try {
    return new Date(createdTime).toLocaleDateString(undefined, {
      dateStyle: 'medium',
    });
  } catch {
    return createdTime;
  }
}

export default async function HostShortlistsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/host/shortlists');

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const shortlists = airtableHostId
    ? await getShortlistsByHost(airtableHostId)
    : [];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Your shortlists
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        View each shortlist to see matched nannies and open their CVs.
      </p>

      {shortlists.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">You don&apos;t have any shortlists yet.</p>
          <Link href="/host/dashboard" className="mt-3 inline-block text-dark-green font-medium hover:underline">
            Go to dashboard to generate one
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {shortlists.map((sl) => {
            const token = sl.id && airtableHostId
              ? generateShortlistToken(sl.id, airtableHostId)
              : '';
            const count = sl.matchIds?.length ?? 0;
            return (
              <li key={sl.id}>
                <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-pastel-black">
                      {formatDate(sl.createdTime)}
                    </p>
                    <p className="text-sm text-dark-green/80">
                      {count} nanny {count === 1 ? 'profile' : 'profiles'}
                    </p>
                  </div>
                  {token ? (
                    <Link
                      href={`/shortlist/${token}`}
                      className="rounded-lg bg-dark-green text-off-white px-4 py-2 text-sm font-medium hover:bg-dark-green/90 transition-colors"
                    >
                      View
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
