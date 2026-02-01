import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getMatchesByNanny } from '@/lib/airtable/matches';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userType = (session.user as { userType?: string }).userType;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  if (userType !== 'Nanny') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!airtableNannyId) {
    return NextResponse.json({ matches: [] });
  }

  const matches = await getMatchesByNanny(airtableNannyId);
  return NextResponse.json({ matches });
}
