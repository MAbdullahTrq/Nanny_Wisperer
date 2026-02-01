import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createShortlistForHost } from '@/lib/matching/shortlist';

export async function POST() {
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
    return NextResponse.json(
      { error: 'Complete your host profile (onboarding) first.' },
      { status: 400 }
    );
  }

  try {
    const shortlistId = await createShortlistForHost(airtableHostId);
    return NextResponse.json({ success: true, shortlistId });
  } catch (e) {
    console.error('Shortlist generate error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate shortlist.' },
      { status: 500 }
    );
  }
}
