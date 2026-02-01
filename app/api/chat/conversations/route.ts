import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  getConversationsByHost,
  getConversationsByNanny,
} from '@/lib/airtable/chat';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userType = (session.user as { userType?: string }).userType;
  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;

  if (userType === 'Host' && airtableHostId) {
    const conversations = await getConversationsByHost(airtableHostId);
    return NextResponse.json({ conversations });
  }
  if (userType === 'Nanny' && airtableNannyId) {
    const conversations = await getConversationsByNanny(airtableNannyId);
    return NextResponse.json({ conversations });
  }

  return NextResponse.json({ conversations: [] });
}
