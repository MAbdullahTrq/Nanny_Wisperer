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
  return NextResponse.json({ hosts });
}
