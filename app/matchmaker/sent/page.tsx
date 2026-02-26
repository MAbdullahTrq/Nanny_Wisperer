import Link from 'next/link';
import { getMatches } from '@/lib/airtable/matches';
import { getHost } from '@/lib/airtable/hosts';
import { getNanny } from '@/lib/airtable/nannies';
import { Card } from '@/components/ui';

export default async function MatchmakerSentPage() {
  const allMatches = await getMatches({ maxRecords: 500 });
  const sent = allMatches.filter((m) => m.sentToHostAt && String(m.sentToHostAt).trim() !== '');
  sent.sort((a, b) => (b.sentToHostAt ?? '').localeCompare(a.sentToHostAt ?? ''));

  const rows = await Promise.all(
    sent.slice(0, 100).map(async (m) => {
      const [host, nanny] = await Promise.all([
        m.hostId ? getHost(m.hostId) : null,
        m.nannyId ? getNanny(m.nannyId) : null,
      ]);
      const hostName = host ? [host.firstName, host.lastName].filter(Boolean).join(' ') : m.hostId ?? '—';
      const caregiverName = nanny ? [nanny.firstName, nanny.lastName].filter(Boolean).join(' ') || 'Caregiver' : m.nannyId ?? '—';
      const nannyType = nanny?.nannyType ?? 'Nanny';
      const status = m.bothProceedAt ? 'Accepted' : m.hostProceed || m.nannyProceed ? 'Viewed' : 'Suggested';
      return {
        id: m.id,
        hostName,
        caregiverName,
        nannyType,
        score: m.score,
        status,
        sentAt: m.sentToHostAt,
        matchSource: m.matchSource ?? 'auto',
      };
    })
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Sent log
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Matches sent to hosts. Status updates when host or caregiver proceeds.
      </p>

      {rows.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">No sent matches yet.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-dark-green/20">
                <th className="py-2 pr-4 font-medium text-pastel-black">Sent date</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Host</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Caregiver</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Type</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Score</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Status</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-light-green/30">
                  <td className="py-3 pr-4 text-dark-green/90">{r.sentAt ? new Date(r.sentAt).toLocaleDateString() : '—'}</td>
                  <td className="py-3 pr-4">{r.hostName}</td>
                  <td className="py-3 pr-4">{r.caregiverName}</td>
                  <td className="py-3 pr-4">{r.nannyType}</td>
                  <td className="py-3 pr-4">{r.score != null ? `${r.score}%` : '—'}</td>
                  <td className="py-3 pr-4">{r.status}</td>
                  <td className="py-3 pr-4">{r.matchSource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
