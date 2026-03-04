import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getUnreadNotifications } from '@/lib/db/notifications';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { userId?: string }).userId;
  if (!userId) {
    return NextResponse.json({ notifications: [] });
  }

  const notifications = await getUnreadNotifications(userId);
  return NextResponse.json({ notifications });
}
