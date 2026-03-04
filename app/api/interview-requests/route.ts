import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createInterviewRequest } from '@/lib/db/interview-requests';
import { getMatch } from '@/lib/db/matches';
import { getHost } from '@/lib/db/hosts';
import { getUserByNannyId } from '@/lib/db/users';
import { createNotification } from '@/lib/db/notifications';
import { generateInterviewToken } from '@/lib/auth/tokens';
import { sendInterviewRequestEmail } from '@/lib/email';
import { config } from '@/lib/config';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const userType = (session.user as { userType?: string }).userType;
  if (userType !== 'Host' || !airtableHostId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    matchId?: string;
    slot1?: string;
    slot2?: string;
    slot3?: string;
    slot4?: string;
    slot5?: string;
    isVip?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { matchId, slot1, slot2, slot3, slot4, slot5, isVip } = body;
  if (
    !matchId ||
    !slot1 ||
    !slot2 ||
    !slot3 ||
    !slot4 ||
    !slot5
  ) {
    return NextResponse.json(
      { error: 'matchId and slot1..slot5 are required' },
      { status: 400 }
    );
  }

  const match = await getMatch(matchId);
  if (!match?.hostId || !match?.nannyId) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }
  if (match.hostId !== airtableHostId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!match.hostProceed || !match.nannyProceed) {
    return NextResponse.json(
      { error: 'Both host and nanny must have proceeded before scheduling' },
      { status: 400 }
    );
  }

  try {
    const interview = await createInterviewRequest({
      matchId,
      hostId: match.hostId,
      nannyId: match.nannyId,
      slot1,
      slot2,
      slot3,
      slot4,
      slot5,
      isVip: Boolean(isVip),
    });

    // Generate tokenized interview link and send email to nanny
    const token = generateInterviewToken(matchId, match.hostId, match.nannyId);
    const interviewUrl = `${config.app.url}/interview/${token}`;

    const [nannyUser, host] = await Promise.all([
      match.nannyId ? getUserByNannyId(match.nannyId) : null,
      match.hostId ? getHost(match.hostId) : null,
    ]);
    const hostName = host
      ? [host.firstName, host.lastName].filter(Boolean).join(' ') || 'A family'
      : 'A family';
    const nannyName = nannyUser?.name ?? 'there';

    if (nannyUser?.email) {
      await sendInterviewRequestEmail({
        to: nannyUser.email,
        name: nannyName,
        hostName,
        selectSlotUrl: interviewUrl,
      });
    }
    if (nannyUser?.id) {
      await createNotification({
        userId: nannyUser.id,
        type: 'interview_request',
        title: 'Interview request from a family',
        message: `${hostName} would like to schedule an interview. Pick a time slot.`,
        link: interviewUrl,
      });
    }

    return NextResponse.json({ success: true, interviewRequest: interview });
  } catch (e) {
    console.error('Create interview request error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create interview request' },
      { status: 500 }
    );
  }
}
