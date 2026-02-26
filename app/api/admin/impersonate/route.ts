import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getUserById } from '@/lib/airtable/users';
import { createImpersonationToken } from '@/lib/auth/impersonation';
import { config } from '@/lib/config';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;
  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const userId = body.userId;
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.locked) {
    return NextResponse.json({ error: 'Cannot impersonate a locked account' }, { status: 400 });
  }

  const token = createImpersonationToken(userId);
  const baseUrl = config.app.url || 'http://localhost:3000';
  const url = `${baseUrl}/login?impersonate=${encodeURIComponent(token)}&callbackUrl=${encodeURIComponent('/auth/redirect')}`;

  return NextResponse.json({ url });
}
