import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { validateToken } from '@/lib/auth/tokens';
import ChatClient from './ChatClient';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: {
    token: string;
  };
}

export default async function ChatPage({ params }: PageProps) {
  try {
    const payload = validateToken(params.token);
    if (!payload || payload.type !== 'chat' || !payload.roomId) {
      notFound();
    }

    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)', maxWidth: '1000px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--spacing-lg)' }}>
          Private Chat
        </h1>
        <ChatClient token={params.token} roomId={payload.roomId} />
      </div>
    );
  } catch (error: any) {
    if (error.message.includes('expired') || error.message.includes('Invalid')) {
      notFound();
    }
    throw error;
  }
}
