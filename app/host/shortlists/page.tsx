import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getShortlistsByHost } from '@/lib/airtable/shortlists';
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

function ShortlistIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function EmptyShortlistIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

export default async function HostShortlistsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/host/shortlists');

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const shortlists = airtableHostId
    ? await getShortlistsByHost(airtableHostId)
    : [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-pastel-black">
          Your shortlists
        </h1>
        <p className="text-dark-green/80 text-sm">
          View each shortlist to see matched nannies and open their CVs.
        </p>
      </div>

      {shortlists.length === 0 ? (
        <Card className="p-8 border-l-4 border-l-dark-green/30">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-light-green/60 p-4 text-dark-green" aria-hidden>
              <EmptyShortlistIcon className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <p className="text-dark-green/80">You don&apos;t have any shortlists yet.</p>
              <Link
                href="/host/dashboard"
                className="inline-block mt-3 text-dark-green font-medium hover:underline"
              >
                Go to dashboard to generate one
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <ul className="space-y-4">
          {shortlists.map((sl) => {
            const count = sl.matchIds?.length ?? 0;
            const href = sl.id ? `/host/shortlists/${sl.id}` : null;
            return (
              <li key={sl.id}>
                {href ? (
                  <Link href={href} className="block">
                    <Card className="p-5 sm:p-6 flex items-center gap-4 border-l-4 border-l-dark-green/40 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="shrink-0 rounded-lg bg-light-green/60 p-4 flex flex-col items-center gap-2 text-dark-green">
                        <ShortlistIcon className="h-6 w-6" aria-hidden />
                        <p className="font-medium text-pastel-black text-sm">
                          {formatDate(sl.createdTime)}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-dark-green/80">
                          {count} nanny {count === 1 ? 'profile' : 'profiles'}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ) : (
                  <Card className="p-5 sm:p-6 flex items-center gap-4 border-l-4 border-l-dark-green/40">
                    <div className="shrink-0 rounded-lg bg-light-green/60 p-4 flex flex-col items-center gap-2 text-dark-green">
                      <ShortlistIcon className="h-6 w-6" aria-hidden />
                      <p className="font-medium text-pastel-black text-sm">
                        {formatDate(sl.createdTime)}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-dark-green/80">
                        {count} nanny {count === 1 ? 'profile' : 'profiles'}
                      </p>
                    </div>
                  </Card>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
