/**
 * T8.4 — Get free slots for a user in a date range. Auth: session userId or query userId for same user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFreeSlots } from '@/lib/google/calendar';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user ? (session.user as { userId?: string }).userId : null;

  const userId = request.nextUrl.searchParams.get('userId') ?? sessionUserId;
  const dateFrom = request.nextUrl.searchParams.get('dateFrom');
  const dateTo = request.nextUrl.searchParams.get('dateTo');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (sessionUserId && userId !== sessionUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: 'dateFrom and dateTo (ISO) required' },
      { status: 400 }
    );
  }

  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }
  if (from >= to) {
    return NextResponse.json({ error: 'dateFrom must be before dateTo' }, { status: 400 });
  }

  try {
    const freeSlots = await getFreeSlots(userId, from, to);
    return NextResponse.json({ freeSlots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Free slots failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
