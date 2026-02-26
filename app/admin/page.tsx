import Link from 'next/link';
import { getHosts } from '@/lib/airtable/hosts';
import { getNannies } from '@/lib/airtable/nannies';
import { Card } from '@/components/ui';

export default async function AdminOverviewPage() {
  const [hosts, caregivers] = await Promise.all([
    getHosts({ maxRecords: 500 }),
    getNannies({ maxRecords: 500 }),
  ]);
  const nannyCount = caregivers.filter((c) => (c.nannyType ?? 'Nanny') === 'Nanny').length;
  const auPairCount = caregivers.filter((c) => c.nannyType === 'Au Pair').length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Admin overview
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Users and subscriptions. For matches, use the Matchmaker dashboard.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5">
          <h2 className="font-medium text-pastel-black">Hosts</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{hosts.length}</p>
          <Link href="/admin/hosts" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View all
          </Link>
        </Card>
        <Card className="p-5">
          <h2 className="font-medium text-pastel-black">Caregivers</h2>
          <p className="mt-2 text-2xl font-semibold text-dark-green">{caregivers.length}</p>
          <p className="text-xs text-dark-green/80 mt-1">{nannyCount} Nanny · {auPairCount} Au Pair</p>
          <Link href="/admin/caregivers" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View all
          </Link>
        </Card>
        <Card className="p-5">
          <h2 className="font-medium text-pastel-black">Subscriptions</h2>
          <p className="mt-2 text-sm text-dark-green/80">Tiers and payments</p>
          <Link href="/admin/subscriptions" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            Manage
          </Link>
        </Card>
        <Card className="p-5">
          <h2 className="font-medium text-pastel-black">Reported issues</h2>
          <p className="mt-2 text-sm text-dark-green/80">User-reported issues</p>
          <Link href="/admin/issues" className="mt-2 inline-block text-sm text-dark-green font-medium hover:underline">
            View
          </Link>
        </Card>
      </div>
    </div>
  );
}
