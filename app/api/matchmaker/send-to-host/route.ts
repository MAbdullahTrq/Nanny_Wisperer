import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createMatch } from '@/lib/airtable/matches';
import { createShortlist } from '@/lib/airtable/shortlists';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isMatchmaker = (session?.user as { isMatchmaker?: boolean } | undefined)?.isMatchmaker;
  if (!session?.user || !isMatchmaker) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { hostId?: string; nannyIds?: string[]; matches?: Array<{ nannyId: string; score?: number }>; matchSource?: 'auto' | 'admin_curated' | 'premium_concierge' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const hostId = body.hostId;
  const matchSource = body.matchSource ?? 'admin_curated';
  if (!hostId) {
    return NextResponse.json({ error: 'hostId is required' }, { status: 400 });
  }

  const sentAt = new Date().toISOString();
  const matchesInput = body.matches ?? (body.nannyIds ?? []).map((nannyId: string) => ({ nannyId, score: 0 }));
  if (matchesInput.length === 0) {
    return NextResponse.json({ error: 'At least one nanny (matches or nannyIds) is required' }, { status: 400 });
  }

  try {
    const matchIds: string[] = [];
    for (const m of matchesInput) {
      const nannyId = typeof m === 'string' ? m : m.nannyId;
      const score = typeof m === 'object' && m && 'score' in m ? (m as { score?: number }).score : undefined;
      const created = await createMatch({
        hostId,
        nannyId,
        score: score ?? 0,
        status: 'pending',
        matchSource,
        sentToHostAt: sentAt,
      });
      matchIds.push(created.id!);
    }
    const shortlist = await createShortlist({ hostId, matchIds });
    return NextResponse.json({
      success: true,
      shortlistId: shortlist.id,
      matchIds,
      sentAt,
    });
  } catch (e) {
    console.error('Matchmaker send-to-host error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to send to host' },
      { status: 500 }
    );
  }
}
