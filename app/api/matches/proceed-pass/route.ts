import { NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth/tokens';
import { getMatch, updateMatch } from '@/lib/airtable/matches';
import {
  getConversationByMatchId,
  createConversation,
} from '@/lib/airtable/chat';

export async function POST(request: Request) {
  let body: { token?: string; choice?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token, choice } = body;
  if (!token || !choice) {
    return NextResponse.json(
      { error: 'token and choice (proceed|pass) are required' },
      { status: 400 }
    );
  }

  if (choice !== 'proceed' && choice !== 'pass') {
    return NextResponse.json(
      { error: 'choice must be proceed or pass' },
      { status: 400 }
    );
  }

  const payload = validateToken(token);
  if (!payload || payload.type !== 'cv' || !payload.matchId) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 401 });
  }

  const match = await getMatch(payload.matchId);
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const isHost = Boolean(payload.hostId);
  const proceed = choice === 'proceed';

  const updates: { hostProceed?: boolean; nannyProceed?: boolean; bothProceedAt?: string; status?: string } = {};

  if (isHost) {
    updates.hostProceed = proceed;
    if (!proceed) updates.status = 'passed';
  } else {
    updates.nannyProceed = proceed;
    if (!proceed) updates.status = 'passed';
  }

  if (proceed && isHost && match.nannyProceed) {
    updates.bothProceedAt = new Date().toISOString();
    updates.status = 'proceeded';
  } else if (proceed && !isHost && match.hostProceed) {
    updates.bothProceedAt = new Date().toISOString();
    updates.status = 'proceeded';
  }

  await updateMatch(payload.matchId, updates);

  if (updates.status === 'proceeded' && match.hostId && match.nannyId) {
    const existing = await getConversationByMatchId(payload.matchId);
    if (!existing) {
      await createConversation(payload.matchId, match.hostId, match.nannyId);
    }
  }

  return NextResponse.json({
    success: true,
    hostProceed: updates.hostProceed ?? match.hostProceed,
    nannyProceed: updates.nannyProceed ?? match.nannyProceed,
    bothProceedAt: updates.bothProceedAt ?? match.bothProceedAt,
  });
}
