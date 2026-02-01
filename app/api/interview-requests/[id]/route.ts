import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  getInterviewRequestById,
  updateInterviewRequest,
} from '@/lib/airtable/interview-requests';
import type { InterviewRequestStatus } from '@/types/airtable';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const interview = await getInterviewRequestById(params.id);
  if (!interview) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const isParticipant =
    (airtableHostId && interview.hostId === airtableHostId) ||
    (airtableNannyId && interview.nannyId === airtableNannyId);

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ interviewRequest: interview });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const interview = await getInterviewRequestById(params.id);
  if (!interview) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const isParticipant =
    (airtableHostId && interview.hostId === airtableHostId) ||
    (airtableNannyId && interview.nannyId === airtableNannyId);

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    selectedSlotIndex?: number;
    googleMeetLink?: string;
    googleCalendarEventId?: string;
    status?: InterviewRequestStatus;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates: Parameters<typeof updateInterviewRequest>[1] = {};
  if (body.selectedSlotIndex !== undefined) updates.selectedSlotIndex = body.selectedSlotIndex;
  if (body.googleMeetLink !== undefined) updates.googleMeetLink = body.googleMeetLink;
  if (body.googleCalendarEventId !== undefined)
    updates.googleCalendarEventId = body.googleCalendarEventId;
  if (body.status !== undefined) updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ interviewRequest: interview });
  }

  const updated = await updateInterviewRequest(params.id, updates);
  return NextResponse.json({ interviewRequest: updated });
}
