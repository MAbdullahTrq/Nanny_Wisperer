import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth/tokens';
import { getInterviewByMatchId, updateInterviewRequest } from '@/lib/db/interviews';
import { getMatch } from '@/lib/db/matches';
import { getHost } from '@/lib/db/hosts';
import { createFastTrackMeeting, createVIPMeeting } from '@/lib/zoom/meetings';
import { updateInterviewWithZoom } from '@/lib/db/interviews';
import { ghlClient } from '@/lib/ghl/client';
import { env } from '@/config/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, slot } = body;

    if (!token || !slot) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const payload = validateToken(token);
    if (!payload || payload.type !== 'interview' || !payload.matchId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get match and interview request
    const [match, interview] = await Promise.all([
      getMatch(payload.matchId),
      getInterviewByMatchId(payload.matchId),
    ]);

    if (!interview || !match) {
      return NextResponse.json(
        { error: 'Interview request or match not found' },
        { status: 404 }
      );
    }

    const hostId = match.hostId ?? '';
    const nannyId = match.nannyId ?? '';
    const isVip = !!(interview as { isVip?: boolean }).isVip;
    const interviewId = (interview as { id?: string }).id ?? '';

    await getHost(hostId);

    // Create Zoom meeting
    const slotDate = {
      start: new Date(slot.start),
      end: new Date(slot.end),
    };

    let zoomMeeting;
    if (isVip) {
      const kayleyId = (env as { ZOOM_ACCOUNT_ID?: string }).ZOOM_ACCOUNT_ID ?? '';
      zoomMeeting = await createVIPMeeting(
        hostId,
        nannyId,
        kayleyId,
        slotDate
      );
    } else {
      zoomMeeting = await createFastTrackMeeting(
        hostId,
        nannyId,
        slotDate
      );
    }
    await updateInterviewWithZoom(
      interviewId,
      zoomMeeting.id,
      zoomMeeting.join_url,
      zoomMeeting.start_url
    );

    // TODO: Send join links via GHL workflow
    // This would typically trigger a GHL workflow to email both parties

    return NextResponse.json({
      success: true,
      meeting: {
        id: zoomMeeting.id,
        joinUrl: zoomMeeting.join_url,
        startUrl: zoomMeeting.start_url,
      },
    });
  } catch (error: any) {
    console.error('Error processing slot selection:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
