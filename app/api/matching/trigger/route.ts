import { NextRequest, NextResponse } from 'next/server';
import { createMatchesAndShortlist } from '@/lib/airtable/matching';
import { getShortlist } from '@/lib/airtable/shortlists';
import { generateShortlistToken } from '@/lib/auth/tokens';
import { env } from '@/config/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostId } = body;

    if (!hostId) {
      return NextResponse.json(
        { error: 'hostId is required' },
        { status: 400 }
      );
    }

    // Create matches and shortlist
    const shortlistId = await createMatchesAndShortlist(hostId);

    // Get shortlist to get host ID
    const shortlist = await getShortlist(shortlistId);

    // Generate tokenized shortlist link
    const shortlistRecord = shortlist as { fields?: { hostId?: string } };
    const token = generateShortlistToken(shortlistId, shortlistRecord?.fields?.hostId);
    const shortlistUrl = `${env.NEXT_PUBLIC_APP_URL}/shortlist/${token}`;

    // TODO: Send shortlist link via GHL workflow

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
