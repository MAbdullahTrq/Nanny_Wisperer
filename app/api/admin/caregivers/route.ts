import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getNannies } from '@/lib/airtable/nannies';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const nannyType = request.nextUrl.searchParams.get('nannyType');
  const caregivers = await getNannies({ maxRecords: 500 });
  const filtered =
    nannyType === 'Au Pair'
      ? caregivers.filter((c) => c.nannyType === 'Au Pair')
      : nannyType === 'Nanny'
        ? caregivers.filter((c) => (c.nannyType ?? 'Nanny') === 'Nanny')
        : caregivers;
  return NextResponse.json({ caregivers: filtered });
}
