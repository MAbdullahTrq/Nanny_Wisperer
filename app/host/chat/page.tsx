import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getConversationsByHost, getLastMessage } from '@/lib/airtable/chat';
import { getNanny } from '@/lib/airtable/nannies';
import { Card } from '@/components/ui';
import type { Conversation } from '@/types/airtable';
import type { Nanny } from '@/types/airtable';

function formatTime(createdTime?: string): string {
  if (!createdTime) return '';
  try {
    const d = new Date(createdTime);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(undefined, { dateStyle: 'short' });
  } catch {
    return createdTime;
  }
}

export default async function HostChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/host/chat');

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const conversations = airtableHostId
    ? await getConversationsByHost(airtableHostId)
    : [];

  const list: Array<{
    conversation: Conversation;
    nanny: Nanny | null;
    lastMessage: { content?: string; createdTime?: string } | null;
  }> = [];

  for (const conv of conversations) {
    if (!conv.id) continue;
    const [nanny, lastMessage] = await Promise.all([
      conv.nannyId ? getNanny(conv.nannyId) : null,
      getLastMessage(conv.id),
    ]);
    list.push({
      conversation: conv,
      nanny,
      lastMessage: lastMessage
        ? { content: lastMessage.content, createdTime: lastMessage.createdTime }
        : null,
    });
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Chat
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Conversations with nannies you&apos;ve both proceeded with.
      </p>

      {list.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">
            No conversations yet. Chat opens when both you and a nanny have proceeded on a match.
          </p>
          <Link href="/host/matches" className="mt-3 inline-block text-dark-green font-medium hover:underline">
            View your matches
          </Link>
        </Card>
      ) : (
        <ul className="space-y-2">
          {list.map(({ conversation, nanny, lastMessage }) => {
            const name = nanny
              ? [nanny.firstName, nanny.lastName].filter(Boolean).join(' ') || 'Nanny'
              : 'Nanny';
            const initial = name.charAt(0).toUpperCase();
            const preview = lastMessage?.content
              ? (lastMessage.content.length > 60
                ? lastMessage.content.slice(0, 60) + '…'
                : lastMessage.content)
              : 'No messages yet';
            return (
              <li key={conversation.id}>
                <Link href={`/host/chat/${conversation.id}`}>
                  <Card className="p-4 hover:bg-light-green/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-light-green flex items-center justify-center text-dark-green font-semibold shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-pastel-black truncate">{name}</p>
                        <p className="text-sm text-dark-green/80 truncate">{preview}</p>
                      </div>
                      {lastMessage?.createdTime && (
                        <span className="text-xs text-dark-green/60 shrink-0">
                          {formatTime(lastMessage.createdTime)}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
