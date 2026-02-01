import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getConversation, getMessages } from '@/lib/airtable/chat';
import { getHost } from '@/lib/airtable/hosts';
import ChatThreadClient from '@/app/host/chat/[conversationId]/ChatThreadClient';

interface PageProps {
  params: { conversationId: string };
}

function hostLabel(host: Awaited<ReturnType<typeof getHost>>): string {
  if (!host) return 'Family';
  const name = [host.firstName, host.lastName].filter(Boolean).join(' ');
  return name || 'Family';
}

export default async function NannyChatThreadPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/nanny/chat');

  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const conversation = await getConversation(params.conversationId);

  if (!conversation?.id) notFound();
  if (conversation.nannyId !== airtableNannyId) notFound();

  const [messages, host] = await Promise.all([
    getMessages(params.conversationId),
    conversation.hostId ? getHost(conversation.hostId) : null,
  ]);

  const label = hostLabel(host);
  const initial = label.charAt(0).toUpperCase();

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/nanny/chat"
          className="text-dark-green/80 hover:text-dark-green text-sm font-medium"
        >
          ← Back to chat
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-light-green flex items-center justify-center text-dark-green font-semibold">
          {initial}
        </div>
        <h1 className="font-display text-xl font-semibold text-pastel-black">{label}</h1>
      </div>

      <ChatThreadClient
        conversationId={params.conversationId}
        initialMessages={messages}
        isHost={false}
      />
    </div>
  );
}
