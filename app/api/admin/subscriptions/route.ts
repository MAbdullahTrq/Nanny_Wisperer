import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getHosts } from '@/lib/airtable/hosts';

export async function GET() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const hosts = await getHosts({ maxRecords: 500 });
  const byTier = hosts.reduce(
    (acc, h) => {
      const t = (h.tier as string) ?? 'Standard';
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return NextResponse.json({ byTier, totalHosts: hosts.length });
}
