import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getConversation, getMessages } from '@/lib/airtable/chat';
import { getNanny } from '@/lib/airtable/nannies';
import ChatThreadClient from './ChatThreadClient';

interface PageProps {
  params: { conversationId: string };
}

export default async function HostChatThreadPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/host/chat');

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const conversation = await getConversation(params.conversationId);

  if (!conversation?.id) notFound();
  if (conversation.hostId !== airtableHostId) notFound();

  const [messages, nanny] = await Promise.all([
    getMessages(params.conversationId),
    conversation.nannyId ? getNanny(conversation.nannyId) : null,
  ]);

  const name = nanny
    ? [nanny.firstName, nanny.lastName].filter(Boolean).join(' ') || 'Nanny'
    : 'Nanny';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/host/chat"
          className="text-dark-green/80 hover:text-dark-green text-sm font-medium"
        >
          ← Back to chat
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-light-green flex items-center justify-center text-dark-green font-semibold">
          {initial}
        </div>
        <h1 className="font-display text-xl font-semibold text-pastel-black">{name}</h1>
      </div>

      <ChatThreadClient
        conversationId={params.conversationId}
        initialMessages={messages}
        isHost={true}
      />
    </div>
  );
}
