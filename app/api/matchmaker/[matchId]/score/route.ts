import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { updateMatch } from '@/lib/airtable/matches';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getServerSession(authOptions);
  const isMatchmaker = (session?.user as { isMatchmaker?: boolean } | undefined)?.isMatchmaker;
  if (!session?.user || !isMatchmaker) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { matchId } = await params;
  if (!matchId) {
    return NextResponse.json({ error: 'matchId required' }, { status: 400 });
  }

  let body: { score?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.score !== 'number' || body.score < 0 || body.score > 100) {
    return NextResponse.json({ error: 'score must be a number 0-100' }, { status: 400 });
  }

  try {
    await updateMatch(matchId, { score: body.score });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Matchmaker score update error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update score' },
      { status: 500 }
    );
  }
}
