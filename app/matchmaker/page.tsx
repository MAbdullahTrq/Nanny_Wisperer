import Link from 'next/link';
import { getHosts } from '@/lib/airtable/hosts';
import { Card } from '@/components/ui';

export default async function MatchmakerQueuePage() {
  const hosts = await getHosts({ maxRecords: 100 });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Matches queue
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Select a host to see suggested matches. Send to host or caregiver from the queue page.
      </p>

      <Card className="p-6">
        <h2 className="font-medium text-pastel-black mb-3">Select host to view suggested matches</h2>
        {hosts.length === 0 ? (
          <p className="text-dark-green/80 text-sm">No hosts yet.</p>
        ) : (
          <ul className="space-y-2">
            {hosts.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/matchmaker/queue?hostId=${encodeURIComponent(h.id ?? '')}`}
                  className="text-dark-green font-medium hover:underline"
                >
                  {h.firstName ?? ''} {h.lastName ?? ''} {h.id ? ` (${h.tier ?? 'Standard'})` : ''}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
