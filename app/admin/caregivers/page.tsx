import { getNannies } from '@/lib/airtable/nannies';
import { getUsersByIds } from '@/lib/airtable/users';
import CaregiversWithSearch from './CaregiversWithSearch';

export default async function AdminCaregiversPage({
  searchParams,
}: {
  searchParams: Promise<{ nannyType?: string }>;
}) {
  const { nannyType } = await searchParams;
  const caregivers = await getNannies({ maxRecords: 500 });
  const userIds = caregivers.map((c) => c.userId).filter((id): id is string => Boolean(id));
  const userMap = userIds.length > 0 ? await getUsersByIds(userIds) : new Map();
  const caregiversWithEmail = caregivers.map((c) => ({
    ...c,
    email: c.userId ? userMap.get(c.userId)?.email : undefined,
  }));

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

      <CaregiversWithSearch caregivers={caregiversWithEmail} initialNannyType={nannyType} />
    </div>
  );
}
