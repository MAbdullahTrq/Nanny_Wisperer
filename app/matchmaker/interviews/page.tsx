import { getInterviewRequests } from '@/lib/airtable/interview-requests';
import { getHost } from '@/lib/airtable/hosts';
import { getNanny } from '@/lib/airtable/nannies';
import { Card } from '@/components/ui';

export default async function MatchmakerInterviewsPage() {
  const requests = await getInterviewRequests({ maxRecords: 200 });
  requests.sort((a, b) => (b.createdTime ?? '').localeCompare(a.createdTime ?? ''));

  const rows = await Promise.all(
    requests.slice(0, 100).map(async (r) => {
      const [host, nanny] = await Promise.all([
        r.hostId ? getHost(r.hostId) : null,
        r.nannyId ? getNanny(r.nannyId) : null,
      ]);
      const hostName = host ? [host.firstName, host.lastName].filter(Boolean).join(' ') : r.hostId ?? '—';
      const caregiverName = nanny ? [nanny.firstName, nanny.lastName].filter(Boolean).join(' ') || 'Caregiver' : r.nannyId ?? '—';
      return {
        id: r.id,
        hostName,
        caregiverName,
        status: r.status ?? '—',
        selectedSlot: r.selectedSlotIndex != null ? `Slot ${r.selectedSlotIndex + 1}` : '—',
        meetLink: r.googleMeetLink ? 'Yes' : '—',
        created: r.createdTime,
      };
    })
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Interview tracking
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        All interview requests. Status and meeting links from host/caregiver flows.
      </p>

      {rows.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">No interview requests yet.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-dark-green/20">
                <th className="py-2 pr-4 font-medium text-pastel-black">Created</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Host</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Caregiver</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Status</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Slot</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Meeting</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-light-green/30">
                  <td className="py-3 pr-4 text-dark-green/90">{r.created ? new Date(r.created).toLocaleDateString() : '—'}</td>
                  <td className="py-3 pr-4">{r.hostName}</td>
                  <td className="py-3 pr-4">{r.caregiverName}</td>
                  <td className="py-3 pr-4">{r.status}</td>
                  <td className="py-3 pr-4">{r.selectedSlot}</td>
                  <td className="py-3 pr-4">{r.meetLink}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
