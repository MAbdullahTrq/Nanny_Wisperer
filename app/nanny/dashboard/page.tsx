import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getMatchesByNanny } from '@/lib/airtable/matches';
import { getNanny } from '@/lib/airtable/nannies';
import { getInterviewRequestsByNanny } from '@/lib/airtable/interview-requests';
import { Card } from '@/components/ui';

const PROFILE_KEYS = [
  'firstName', 'lastName', 'phone', 'currentLocation', 'nationality',
  'aboutMe', 'availableStartDate', 'yearsChildcareExperience', 'languageSkills',
] as const;

function profileCompletionPercent(nanny: Record<string, unknown> | null): number {
  if (!nanny) return 0;
  let filled = 0;
  for (const k of PROFILE_KEYS) {
    const v = nanny[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') filled++;
  }
  return Math.round((filled / PROFILE_KEYS.length) * 100);
}

export default async function NannyDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/nanny/dashboard');

  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const badge = (session.user as { badge?: string })?.badge ?? 'Basic';
  let nanny: Awaited<ReturnType<typeof getNanny>> = null;
  let shortlistedCount = 0;
  let interviewRequestsCount = 0;
  let meetingsCount = 0;
  let profilePercent = 0;
  let nannyType: string = 'Nanny';

  if (airtableNannyId) {
    const [nannyData, matches, requests] = await Promise.all([
      getNanny(airtableNannyId),
      getMatchesByNanny(airtableNannyId),
      getInterviewRequestsByNanny(airtableNannyId),
    ]);
    nanny = nannyData;
    shortlistedCount = matches.length;
    interviewRequestsCount = requests.length;
    meetingsCount = requests.filter((r) => r.status === 'meeting_created').length;
    profilePercent = profileCompletionPercent(nanny ? (nanny as Record<string, unknown>) : null);
    nannyType = (nanny?.nannyType as string) ?? 'Nanny';
  }

  const profileBadge = nanny?.badge ?? nanny?.tier ?? badge;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Caregiver dashboard
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        You&apos;re registered as a {nannyType}. When families shortlist you, you&apos;ll see it here.
      </p>

      <div className="mb-6 flex flex-wrap gap-2 text-sm text-dark-green/80">
        <span>Profile completion: <strong className="text-pastel-black">{profilePercent}%</strong></span>
        <span>·</span>
        <span>Verification: <strong className="text-pastel-black">{profileBadge}</strong></span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Match suggestions</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{shortlistedCount}</p>
          <Link href="/nanny/matches" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View matches
          </Link>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Interview requests</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{interviewRequestsCount}</p>
          <Link href="/nanny/interview-requests" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View requests
          </Link>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Upcoming meetings</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{meetingsCount}</p>
          <Link href="/nanny/meetings" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View meetings
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Saved families</h2>
          <p className="mt-2 text-sm text-dark-green/80">—</p>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Contract status</h2>
          <p className="mt-2 text-sm text-dark-green/80">—</p>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Messaging</h2>
          <Link href="/nanny/chat" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            Open chat
          </Link>
        </Card>
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black">Availability calendar</h2>
          <p className="mt-2 text-sm text-dark-green/80">—</p>
        </Card>
      </div>

      {nannyType === 'Au Pair' && (
        <Card className="p-6 mb-8 border-light-green/50 bg-light-green/10">
          <h2 className="font-medium text-pastel-black mb-3">Au Pair guidance</h2>
          <ul className="space-y-2 text-sm text-dark-green/90">
            <li><strong>Visa:</strong> Check your host country&apos;s au pair visa requirements and allow time for processing.</li>
            <li><strong>Cultural exchange:</strong> Au pair stays are a cultural exchange; you may have language or activity arrangements with the family.</li>
            <li><strong>Max 30h weekly:</strong> Under EU Au Pair regulations, au pairs may work up to 30 hours per week. Hours are usually in the afternoons but may vary.</li>
            <li><strong>Pocket money:</strong> {nanny?.expectedWeeklyPocketMoney != null && String(nanny.expectedWeeklyPocketMoney).trim() !== '' ? `You indicated ${nanny.expectedWeeklyPocketMoney} per week.` : 'Discuss pocket money with your host family; typical ranges vary by country.'}</li>
          </ul>
        </Card>
      )}

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
