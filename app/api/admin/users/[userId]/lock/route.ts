import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/airtable/users';
import { sendAccountLockedEmail, sendAccountUnlockedEmail } from '@/lib/email';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;
  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  let body: { locked?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.locked !== 'boolean') {
    return NextResponse.json({ error: 'locked must be true or false' }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await updateUser(userId, { locked: body.locked });

  if (user.email) {
    const emailFn = body.locked ? sendAccountLockedEmail : sendAccountUnlockedEmail;
    emailFn({ to: user.email, name: user.name || user.email }).catch(() => {});
  }

  return NextResponse.json({ locked: body.locked });
}
