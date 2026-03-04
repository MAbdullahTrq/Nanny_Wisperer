import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createShortlistForHost } from '@/lib/matching/shortlist';
import { getShortlist } from '@/lib/db/shortlists';
import { generateShortlistToken } from '@/lib/auth/tokens';
import { getUserByHostId } from '@/lib/db/users';
import { createNotification } from '@/lib/db/notifications';
import { sendShortlistDeliveredEmail } from '@/lib/email';
import { triggerShortlistReady } from '@/lib/ghl/workflows';
import { env } from '@/config/env';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;
  const isMatchmaker = (session?.user as { isMatchmaker?: boolean })?.isMatchmaker;
  if (!session?.user || (!isAdmin && !isMatchmaker)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { hostId } = body;

    if (!hostId) {
      return NextResponse.json(
        { error: 'hostId is required' },
        { status: 400 }
      );
    }

    // Create matches and shortlist (single implementation: lib/matching + DB)
    const shortlistId = await createShortlistForHost(hostId);

    // Get shortlist to get host ID for token
    const shortlist = await getShortlist(shortlistId);

    // Generate tokenized shortlist link
    const token = generateShortlistToken(shortlistId, shortlist?.hostId);
    const shortlistUrl = `${env.NEXT_PUBLIC_APP_URL}/shortlist/${token}`;
    const nannyCount = shortlist?.matchIds?.length ?? 0;

    // Send shortlist-delivered email to host; optionally trigger GHL workflow
    if (shortlist?.hostId && nannyCount > 0) {
      const hostUser = await getUserByHostId(shortlist.hostId);
      if (hostUser?.email) {
        await sendShortlistDeliveredEmail({
          to: hostUser.email,
          name: hostUser.name ?? 'there',
          shortlistUrl,
          nannyCount,
        });
      }
      await triggerShortlistReady({
        contactId: hostUser?.ghlContactId,
        shortlistUrl,
        hostId: shortlist.hostId,
        nannyCount,
      });
      if (hostUser?.id) {
        await createNotification({
          userId: hostUser.id,
          type: 'shortlist_ready',
          title: 'Your shortlist is ready',
          message: `You have ${nannyCount} caregiver${nannyCount !== 1 ? 's' : ''} to review.`,
          link: shortlistUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      shortlistId,
      shortlistUrl,
      token,
      message: 'Matching completed and shortlist created',
    });
  } catch (error: any) {
    console.error('Error triggering matching:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
