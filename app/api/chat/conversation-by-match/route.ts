import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getConversationByMatchId, getConversation } from '@/lib/airtable/chat';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const matchId = request.nextUrl.searchParams.get('matchId');
  if (!matchId) {
    return NextResponse.json(
      { error: 'matchId is required' },
      { status: 400 }
    );
  }

  const conversation = await getConversationByMatchId(matchId);
  if (!conversation || !conversation.id) {
    return NextResponse.json({ conversationId: null });
  }

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const isParticipant =
    (airtableHostId && conversation.hostId === airtableHostId) ||
    (airtableNannyId && conversation.nannyId === airtableNannyId);

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ conversationId: conversation.id });
}
