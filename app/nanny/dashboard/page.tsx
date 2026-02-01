import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getMatchesByNanny } from '@/lib/airtable/matches';
import { getNanny } from '@/lib/airtable/nannies';
import { Card } from '@/components/ui';

export default async function NannyDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/nanny/dashboard');

  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const badge = (session.user as { badge?: string })?.badge ?? 'Basic';
  const shortlistedCount = airtableNannyId
    ? (await getMatchesByNanny(airtableNannyId)).length
    : 0;
  const interviewRequestsCount = 0;
  const meetingsCount = 0;

  let profileBadge = badge;
  if (airtableNannyId) {
    const nanny = await getNanny(airtableNannyId);
    if (nanny?.badge) profileBadge = nanny.badge;
    else if (nanny?.tier) profileBadge = nanny.tier;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Nanny dashboard
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Welcome back. When families shortlist you, you&apos;ll see it here.
      </p>

      <div className="mb-6 flex flex-wrap gap-2 text-sm text-dark-green/80">
        <span>Profile badge: <strong className="text-pastel-black">{profileBadge}</strong></span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card className="p-5">
          <h2 className="font-medium text-pastel-black">You&apos;ve been shortlisted</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{shortlistedCount}</p>
          <Link href="/nanny/matches" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View matches
          </Link>
        </Card>
        <Card className="p-5">
          <h2 className="font-medium text-pastel-black">Interview requests</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{interviewRequestsCount}</p>
          <Link href="/nanny/interview-requests" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View requests
          </Link>
        </Card>
        <Card className="p-5">
          <h2 className="font-medium text-pastel-black">Upcoming meetings</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{meetingsCount}</p>
          <Link href="/nanny/meetings" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View meetings
          </Link>
        </Card>
      </div>

      {!airtableNannyId && (
        <Card className="p-5 border-light-pink/50 bg-light-pink/20">
          <p className="text-dark-green font-medium">Complete your profile</p>
          <p className="text-sm text-dark-green/80 mt-1">Finish onboarding to appear in shortlists.</p>
          <Link href="/nanny/onboarding" className="mt-3 inline-block text-dark-green font-medium hover:underline">
            Go to onboarding
          </Link>
        </Card>
      )}

      <p className="mt-6 text-sm text-dark-green/60">
        Logged in as {session.user?.email}
      </p>
    </div>
  );
}
