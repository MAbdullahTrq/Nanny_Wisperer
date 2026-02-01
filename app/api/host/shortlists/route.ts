import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getShortlistsByHost } from '@/lib/airtable/shortlists';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userType = (session.user as { userType?: string }).userType;
  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  if (userType !== 'Host') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!airtableHostId) {
    return NextResponse.json({ shortlists: [] });
  }

  const shortlists = await getShortlistsByHost(airtableHostId);
  return NextResponse.json({ shortlists });
}
