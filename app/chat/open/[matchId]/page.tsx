import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getMatch } from '@/lib/airtable/matches';
import {
  getConversationByMatchId,
  createConversation,
} from '@/lib/airtable/chat';

interface PageProps {
  params: { matchId: string };
}

export default async function ChatOpenPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=/chat/open/${params.matchId}`);
  }

  const match = await getMatch(params.matchId);
  if (!match?.hostId || !match?.nannyId) {
    redirect('/');
  }

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const userType = (session.user as { userType?: string }).userType;

  const isHost = userType === 'Host' && airtableHostId === match.hostId;
  const isNanny = userType === 'Nanny' && airtableNannyId === match.nannyId;

  if (!isHost && !isNanny) {
    redirect('/');
  }

  let conversation = await getConversationByMatchId(params.matchId);
  if (!conversation?.id) {
    const created = await createConversation(
      params.matchId,
      match.hostId,
      match.nannyId
    );
    conversation = created;
  }

  if (isHost) {
    redirect(`/host/chat/${conversation.id}`);
  }
  redirect(`/nanny/chat/${conversation.id}`);
}
