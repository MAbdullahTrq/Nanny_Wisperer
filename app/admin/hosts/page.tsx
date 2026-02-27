import { getHosts } from '@/lib/airtable/hosts';
import { getUsersByIds } from '@/lib/airtable/users';
import HostsWithSearch from './HostsWithSearch';

export default async function AdminHostsPage() {
  const hosts = await getHosts({ maxRecords: 500 });
  const userIds = hosts.map((h) => h.userId).filter((id): id is string => Boolean(id));
  const userMap = userIds.length > 0 ? await getUsersByIds(userIds) : new Map();
  const hostsWithEmail = hosts.map((h) => ({
    ...h,
    email: h.userId ? userMap.get(h.userId)?.email : undefined,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Hosts
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        All host families. No match data here — use Matchmaker dashboard for matches.
      </p>

      <HostsWithSearch hosts={hostsWithEmail} />
    </div>
  );
}
