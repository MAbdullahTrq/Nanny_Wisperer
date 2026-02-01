import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getMatch } from '@/lib/airtable/matches';
import { getInterviewRequestByMatchId } from '@/lib/airtable/interview-requests';
import { Card } from '@/components/ui';
import ScheduleInterviewForm from './ScheduleInterviewForm';

const DURATION_MINUTES = 30;

interface PageProps {
  params: { matchId: string };
}

export default async function HostScheduleInterviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/host/schedule-interview/' + params.matchId);

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const match = await getMatch(params.matchId);

  if (!match?.hostId || !match?.nannyId) notFound();
  if (match.hostId !== airtableHostId) notFound();
  if (!match.hostProceed || !match.nannyProceed) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
          Schedule interview
        </h1>
        <Card className="p-6">
          <p className="text-dark-green/80">
            Both you and the nanny must have clicked Proceed before scheduling an interview.
          </p>
          <Link href="/host/matches" className="mt-3 inline-block text-dark-green font-medium hover:underline">
            Back to matches
          </Link>
        </Card>
      </div>
    );
  }

  const existing = await getInterviewRequestByMatchId(params.matchId);
  if (existing?.status === 'pending_slots' || existing?.status === 'nanny_selected') {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
          Schedule interview
        </h1>
        <Card className="p-6">
          <p className="text-dark-green font-medium">Slots already sent.</p>
          <p className="text-sm text-dark-green/80 mt-1">
            The nanny will choose one of the 5 slots. You can send new slots if they select &quot;None available&quot;.
          </p>
          <Link href="/host/matches" className="mt-3 inline-block text-dark-green font-medium hover:underline">
            Back to matches
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Choose 5 time slots
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Select 5 possible interview times (30 min each). The nanny will pick one.
      </p>

      <ScheduleInterviewForm
        matchId={params.matchId}
        durationMinutes={DURATION_MINUTES}
      />
    </div>
  );
}
