import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getUnreadCount } from '@/lib/db/notifications';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ count: 0 });
  }

  const userId = (session.user as { userId?: string }).userId;
  if (!userId) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getUnreadCount(userId);
  return NextResponse.json({ count });
}
