import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getUserById } from '@/lib/db/users';
import { updateHost, getHostByUserId } from '@/lib/db/hosts';
import { updateNanny, getNannyByUserId } from '@/lib/db/nannies';

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

  let body: { tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const tier = typeof body.tier === 'string' ? body.tier.trim() : undefined;
  if (tier === undefined) {
    return NextResponse.json({ error: 'tier required' }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const uid = user.id ?? userId;
  const hostId = user.airtableHostId ?? (await getHostByUserId(uid))?.id;
  if (hostId) {
    await updateHost(hostId, { tier: tier || undefined });
    return NextResponse.json({ tier, updated: 'host' });
  }
  const nannyId = user.airtableNannyId ?? (await getNannyByUserId(uid))?.id;
  if (nannyId) {
    await updateNanny(nannyId, { tier: tier || undefined, badge: tier || undefined });
    return NextResponse.json({ tier, updated: 'nanny' });
  }

  return NextResponse.json(
    { error: 'User has no linked host or nanny profile; complete onboarding first.' },
    { status: 400 }
  );
}
