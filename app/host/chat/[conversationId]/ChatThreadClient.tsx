'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import type { Message } from '@/types/airtable';

const POLL_INTERVAL_MS = 4000;

interface ChatThreadClientProps {
  conversationId: string;
  initialMessages: Message[];
  isHost: boolean;
}

function formatMessageTime(createdTime?: string): string {
  if (!createdTime) return '';
  try {
    return new Date(createdTime).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function ChatThreadClient({
  conversationId,
  initialMessages,
  isHost,
}: ChatThreadClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.messages)) setMessages(data.messages);
  };

  useEffect(() => {
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content: text }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setContent('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] min-h-[300px]">
      <div className="flex-1 overflow-y-auto space-y-3 p-2 border border-light-green/40 rounded-lg bg-off-white/50">
        {messages.length === 0 ? (
          <p className="text-dark-green/60 text-sm text-center py-4">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => {
            const isMe =
              (isHost && msg.senderType === 'Host') || (!isHost && msg.senderType === 'Nanny');
            return (
              <div
                key={msg.id ?? msg.createdTime}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-dark-green text-off-white'
                      : 'bg-light-green/60 text-pastel-black'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content ?? ''}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-off-white/80' : 'text-dark-green/70'}`}>
                    {formatMessageTime(msg.createdTime)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black placeholder:text-dark-green/50 focus:border-dark-green focus:outline-none"
          disabled={sending}
        />
        <Button type="submit" variant="primary" disabled={sending || !content.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
