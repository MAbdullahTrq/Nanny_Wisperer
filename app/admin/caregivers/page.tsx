import Link from 'next/link';
import { getNannies } from '@/lib/airtable/nannies';
import { Card } from '@/components/ui';

export default async function AdminCaregiversPage({
  searchParams,
}: {
  searchParams: Promise<{ nannyType?: string }>;
}) {
  const { nannyType } = await searchParams;
  const caregivers = await getNannies({ maxRecords: 500 });
  const filtered =
    nannyType === 'Au Pair'
      ? caregivers.filter((c) => c.nannyType === 'Au Pair')
      : nannyType === 'Nanny'
        ? caregivers.filter((c) => (c.nannyType ?? 'Nanny') === 'Nanny')
        : caregivers;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Caregivers
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Nannies and Au Pairs. No match data here — use Matchmaker dashboard for matches.
      </p>
      <p className="text-dark-green/60 text-xs mb-4">
        Caregivers are loaded from the <strong>Nannies</strong> table in Airtable. A nanny appears here only after they complete onboarding (save at least one section). If your table has a different name, set <code className="bg-light-green/30 px-1 rounded">AIRTABLE_NANNIES_TABLE_NAME</code> in your env.
      </p>

      <div className="flex gap-2 mb-4">
        <a
          href="/admin/caregivers"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${!nannyType ? 'bg-dark-green text-off-white' : 'bg-light-green/40 text-dark-green hover:bg-light-green/60'}`}
        >
          All
        </a>
        <a
          href="/admin/caregivers?nannyType=Nanny"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${nannyType === 'Nanny' ? 'bg-dark-green text-off-white' : 'bg-light-green/40 text-dark-green hover:bg-light-green/60'}`}
        >
          Nanny
        </a>
        <a
          href="/admin/caregivers?nannyType=Au%20Pair"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${nannyType === 'Au Pair' ? 'bg-dark-green text-off-white' : 'bg-light-green/40 text-dark-green hover:bg-light-green/60'}`}
        >
          Au Pair
        </a>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">No caregivers match the filter.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-dark-green/20">
                <th className="py-2 pr-4 font-medium text-pastel-black">Name</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Type</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Badge / Tier</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Location</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">User</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-light-green/30">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-pastel-black">
                      {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{(c.nannyType as string) ?? 'Nanny'}</td>
                  <td className="py-3 pr-4">{c.badge ?? c.tier ?? '—'}</td>
                  <td className="py-3 pr-4">{c.currentLocation ?? c.city ?? '—'}</td>
                  <td className="py-3 pr-4">
                    {c.userId ? (
                      <Link href={`/admin/users/${c.userId}`} className="text-dark-green font-medium hover:underline">
                        View user
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
