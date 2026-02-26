import Link from 'next/link';
import { getHosts } from '@/lib/airtable/hosts';
import { Card } from '@/components/ui';

export default async function AdminHostsPage() {
  const hosts = await getHosts({ maxRecords: 500 });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Hosts
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        All host families. No match data here — use Matchmaker dashboard for matches.
      </p>

      {hosts.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">No hosts yet.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-dark-green/20">
                <th className="py-2 pr-4 font-medium text-pastel-black">Name / Email</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Location</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Tier</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Start date</th>
              </tr>
            </thead>
            <tbody>
              {hosts.map((h) => (
                <tr key={h.id} className="border-b border-light-green/30">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-pastel-black">{h.firstName ?? ''} {h.lastName ?? ''}</span>
                  </td>
                  <td className="py-3 pr-4 text-dark-green/90">{h.location ?? h.city ?? '—'}</td>
                  <td className="py-3 pr-4">{h.tier ?? '—'}</td>
                  <td className="py-3 pr-4">{h.desiredStartDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
