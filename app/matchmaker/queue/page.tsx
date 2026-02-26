import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getHost } from '@/lib/airtable/hosts';
import { getEligibleNannies } from '@/lib/matching/algorithm';
import MatchmakerQueueClient from './MatchmakerQueueClient';
import { Card } from '@/components/ui';

export default async function MatchmakerQueueHostPage({
  searchParams,
}: {
  searchParams: Promise<{ hostId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const isMatchmaker = (session?.user as { isMatchmaker?: boolean } | undefined)?.isMatchmaker;
  if (!session?.user || !isMatchmaker) redirect('/login?callbackUrl=/matchmaker');

  const { hostId } = await searchParams;
  if (!hostId) {
    return (
      <div>
        <Link href="/matchmaker" className="text-dark-green font-medium hover:underline mb-4 inline-block">← Back to queue</Link>
        <p className="text-dark-green/80">Select a host from the queue.</p>
      </div>
    );
  }

  const host = await getHost(hostId);
  if (!host) {
    return (
      <div>
        <Link href="/matchmaker" className="text-dark-green font-medium hover:underline mb-4 inline-block">← Back to queue</Link>
        <p className="text-dark-green/80">Host not found.</p>
      </div>
    );
  }

  const eligible = await getEligibleNannies(host, { minScore: 50, maxCandidates: 20 });
  const hostName = [host.firstName, host.lastName].filter(Boolean).join(' ') || 'Host';

  return (
    <div>
      <Link href="/matchmaker" className="text-dark-green font-medium hover:underline mb-4 inline-block">← Back to queue</Link>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Suggested matches for {hostName}
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        {eligible.length} caregiver(s) above score threshold. Send to host or adjust score.
      </p>

      <MatchmakerQueueClient
        hostId={hostId}
        hostName={hostName}
        suggested={eligible.map(({ nanny, score }) => ({
          nannyId: nanny.id ?? '',
          name: [nanny.firstName, nanny.lastName].filter(Boolean).join(' ') || 'Caregiver',
          nannyType: (nanny.nannyType as string) ?? 'Nanny',
          score: score.total,
        }))}
      />
    </div>
  );
}
