import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getShortlistsByHost } from '@/lib/airtable/shortlists';
import { getMatchesByHost } from '@/lib/airtable/matches';
import { getInterviewRequestsByHost } from '@/lib/airtable/interview-requests';
import { Card, Button } from '@/components/ui';
import GenerateShortlistButton from './GenerateShortlistButton';

export default async function HostDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/host/dashboard');

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const tier = (session.user as { tier?: string })?.tier ?? 'Standard';
  const membershipStatus = 'Active';

  let shortlistsCount = 0;
  let pendingMatchesCount = 0;
  let meetingsCount = 0;
  let sentRequestsCount = 0;
  let interviewsBookedCount = 0;
  const profileStatus = airtableHostId ? 'Complete' : 'Under review';

  if (airtableHostId) {
    const [shortlists, matches, interviewRequests] = await Promise.all([
      getShortlistsByHost(airtableHostId),
      getMatchesByHost(airtableHostId),
      getInterviewRequestsByHost(airtableHostId),
    ]);
    shortlistsCount = shortlists.length;
    pendingMatchesCount = matches.filter(
      (m) => m.status !== 'passed' && !(m.hostProceed && m.nannyProceed)
    ).length;
    sentRequestsCount = interviewRequests.length;
    interviewsBookedCount = interviewRequests.filter((r) => r.status === 'meeting_created').length;
    meetingsCount = interviewsBookedCount;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Host dashboard
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Welcome back. Your shortlists, matches, and meetings appear below.
      </p>

      <div className="mb-6 flex flex-wrap gap-2 text-sm text-dark-green/80">
        <span>Profile: <strong className="text-pastel-black">{profileStatus}</strong></span>
        <span>·</span>
        <span>Tier: <strong className="text-pastel-black">{tier}</strong></span>
        <span>·</span>
        <span>Membership: <strong className="text-pastel-black">{membershipStatus}</strong></span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Matches suggested</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{pendingMatchesCount + (shortlistsCount > 0 ? 0 : 0)}</p>
          <Link href="/host/matches" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View matches
          </Link>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Your shortlists</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{shortlistsCount}</p>
          <Link href="/host/shortlists" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View shortlists
          </Link>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Sent requests</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{sentRequestsCount}</p>
          <p className="text-xs text-dark-green/80 mt-1">Interview requests sent</p>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Interviews booked</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{interviewsBookedCount}</p>
          <Link href="/host/meetings" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View meetings
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Contract status</h2>
          <p className="mt-2 text-sm text-dark-green/80">—</p>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Payments</h2>
          <p className="mt-2 text-sm text-dark-green/80">—</p>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Messaging</h2>
          <Link href="/host/chat" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            Open chat
          </Link>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Notifications</h2>
          <p className="mt-2 text-sm text-dark-green/80">—</p>
        </Card>
      </div>

      {!airtableHostId && (
        <Card className="p-5 border-light-pink/50 bg-light-pink/20">
          <p className="text-dark-green font-medium">Complete your profile</p>
          <p className="text-sm text-dark-green/80 mt-1">Finish onboarding to receive shortlists and matches.</p>
          <Link href="/host/onboarding">
            <Button variant="primary" className="mt-3">Go to onboarding</Button>
          </Link>
        </Card>
      )}

      {airtableHostId && shortlistsCount === 0 && (
        <Card className="p-5 border-light-green/50 bg-light-green/10">
          <p className="text-dark-green font-medium">Generate your first shortlist</p>
          <p className="text-sm text-dark-green/80 mt-1">We&apos;ll match you with nannies based on your profile.</p>
          <GenerateShortlistButton className="mt-3" />
        </Card>
      )}

      <p className="mt-6 text-sm text-dark-green/60">
        Logged in as {session.user?.email}
      </p>
    </div>
  );
}
