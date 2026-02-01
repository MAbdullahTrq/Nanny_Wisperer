import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getConversation, addMessage } from '@/lib/airtable/chat';
import type { SenderType } from '@/types/airtable';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { conversationId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { conversationId, content } = body;
  if (!conversationId || typeof content !== 'string') {
    return NextResponse.json(
      { error: 'conversationId and content are required' },
      { status: 400 }
    );
  }

  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const userId = (session.user as { userId?: string }).userId;

  let senderId: string;
  let senderType: SenderType;

  if (airtableHostId && conversation.hostId === airtableHostId) {
    senderId = userId ?? airtableHostId;
    senderType = 'Host';
  } else if (airtableNannyId && conversation.nannyId === airtableNannyId) {
    senderId = userId ?? airtableNannyId;
    senderType = 'Nanny';
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const message = await addMessage(
    conversationId,
    senderId,
    senderType,
    content.trim()
  );
  return NextResponse.json({ success: true, message });
}
