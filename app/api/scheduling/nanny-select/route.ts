import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth/tokens';
import { getInterviewByMatchId, updateInterviewRequest } from '@/lib/airtable/interviews';
import { getMatch } from '@/lib/airtable/matches';
import { getHost } from '@/lib/airtable/hosts';
import { createFastTrackMeeting, createVIPMeeting } from '@/lib/zoom/meetings';
import { updateInterviewWithZoom } from '@/lib/airtable/interviews';
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

    const matchFields = (match as { fields?: { hostId?: string; nannyId?: string } }).fields ?? {};
    const interviewFields = (interview as { id?: string; fields?: { tier?: string } }).fields ?? {};

    const host = await getHost(matchFields.hostId ?? '');
    const tier = interviewFields.tier;

    // Create Zoom meeting
    const slotDate = {
      start: new Date(slot.start),
      end: new Date(slot.end),
    };

    let zoomMeeting;
    if (tier === 'VIP') {
      const kayleyId = (env as { ZOOM_ACCOUNT_ID?: string }).ZOOM_ACCOUNT_ID ?? '';
      zoomMeeting = await createVIPMeeting(
        matchFields.hostId,
        matchFields.nannyId,
        kayleyId,
        slotDate
      );
    } else {
      zoomMeeting = await createFastTrackMeeting(
        matchFields.hostId,
        matchFields.nannyId,
        slotDate
      );
    }

    const interviewId = (interview as { id?: string }).id ?? '';
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
