import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { validateToken } from '@/lib/auth/tokens';
import { getInterviewRequestById, updateInterviewRequest } from '@/lib/airtable/interview-requests';

/**
 * Nanny selects a slot or "None available". Auth via session (nanny) or token (tokenized link).
 * Body: { token?: string, selectedSlotIndex?: number (0-4), noneAvailable?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: { token?: string; selectedSlotIndex?: number; noneAvailable?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const interview = await getInterviewRequestById(params.id);
  if (!interview) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const airtableNannyId = session?.user
    ? (session.user as { airtableNannyId?: string }).airtableNannyId
    : null;
  const payload = body.token ? validateToken(body.token) : null;
  const allowedBySession =
    airtableNannyId && interview.nannyId === airtableNannyId;
  const allowedByToken =
    payload?.type === 'interview' &&
    payload.matchId === interview.matchId &&
    payload.nannyId === interview.nannyId;
  if (!allowedBySession && !allowedByToken) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (interview.status !== 'pending_slots') {
    return NextResponse.json(
      { error: 'Slot already selected or request closed' },
      { status: 400 }
    );
  }

  if (body.noneAvailable) {
    await updateInterviewRequest(params.id, {
      status: 'none_available',
    });
    return NextResponse.json({
      success: true,
      status: 'none_available',
      message: 'Host will send new slots.',
    });
  }

  const index = body.selectedSlotIndex;
  if (typeof index !== 'number' || index < 0 || index > 4) {
    return NextResponse.json(
      { error: 'selectedSlotIndex must be 0–4' },
      { status: 400 }
    );
  }

  const slotKey = `slot${index + 1}` as 'slot1' | 'slot2' | 'slot3' | 'slot4' | 'slot5';
  if (!interview[slotKey]) {
    return NextResponse.json(
      { error: 'Selected slot is not available' },
      { status: 400 }
    );
  }

  await updateInterviewRequest(params.id, {
    selectedSlotIndex: index,
    status: 'nanny_selected',
  });

  return NextResponse.json({
    success: true,
    status: 'nanny_selected',
    selectedSlotIndex: index,
    message: 'Meeting will be scheduled shortly.',
  });
}
