import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createMatch } from '@/lib/airtable/matches';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isMatchmaker = (session?.user as { isMatchmaker?: boolean } | undefined)?.isMatchmaker;
  if (!session?.user || !isMatchmaker) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { hostId?: string; nannyId?: string; score?: number; matchSource?: 'admin_curated' | 'premium_concierge' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const hostId = body.hostId;
  const nannyId = body.nannyId;
  const score = body.score ?? 0;
  const matchSource = body.matchSource ?? 'admin_curated';
  if (!hostId || !nannyId) {
    return NextResponse.json({ error: 'hostId and nannyId are required' }, { status: 400 });
  }

  try {
    const created = await createMatch({
      hostId,
      nannyId,
      score,
      status: 'pending',
      matchSource,
    });
    return NextResponse.json({ success: true, matchId: created.id });
  } catch (e) {
    console.error('Matchmaker force-suggest error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create match' },
      { status: 500 }
    );
  }
}
