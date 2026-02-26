import { getHosts } from '@/lib/airtable/hosts';
import { Card } from '@/components/ui';

export default async function AdminSubscriptionsPage() {
  const hosts = await getHosts({ maxRecords: 500 });
  const byTier = hosts.reduce(
    (acc, h) => {
      const t = (h.tier as string) ?? 'Standard';
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Subscriptions
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Tier and payment tracking. Payments integration placeholder.
      </p>

      <Card className="p-6 mb-6">
        <h2 className="font-medium text-pastel-black mb-3">Hosts by tier</h2>
        <ul className="space-y-2 text-sm text-dark-green">
          {Object.entries(byTier).map(([tier, count]) => (
            <li key={tier}>
              <span className="font-medium text-pastel-black">{tier}</span>: {count}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6 border-light-green/50">
        <p className="text-dark-green/80 text-sm">
          Payment tracking: connect your payment provider (Stripe, etc.) to show renewal and payment status here.
        </p>
      </Card>
    </div>
  );
}
