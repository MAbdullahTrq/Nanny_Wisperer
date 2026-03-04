import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getInterviewRequestsByHost, getInterviewRequestsByNanny } from '@/lib/db/interview-requests';
import { getHost } from '@/lib/db/hosts';
import { getNanny } from '@/lib/db/nannies';

function getSelectedSlotDateTime(ir: {
  selectedSlotIndex?: number;
  slot1?: string;
  slot2?: string;
  slot3?: string;
  slot4?: string;
  slot5?: string;
}): string | null {
  const idx = ir.selectedSlotIndex;
  if (idx == null || idx < 0 || idx > 4) return null;
  const slots = [ir.slot1, ir.slot2, ir.slot3, ir.slot4, ir.slot5].filter(Boolean);
  return slots[idx] ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userType = (session.user as { userType?: string }).userType;
  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;

  if (userType === 'Host' && airtableHostId) {
    const requests = await getInterviewRequestsByHost(airtableHostId);
    const meetings = requests.filter((r) => r.status === 'meeting_created');
    const list = await Promise.all(
      meetings.map(async (ir) => {
        const nanny = ir.nannyId ? await getNanny(ir.nannyId) : null;
        const otherPartyName = nanny
          ? [nanny.firstName, nanny.lastName].filter(Boolean).join(' ') || 'Caregiver'
          : 'Caregiver';
        const dateTime = getSelectedSlotDateTime(ir);
        return {
          id: ir.id,
          matchId: ir.matchId,
          interviewRequestId: ir.id,
          dateTime: dateTime ?? undefined,
          otherPartyName,
          googleMeetLink: ir.googleMeetLink ?? undefined,
        };
      })
    );
    list.sort((a, b) => {
      if (!a.dateTime || !b.dateTime) return 0;
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    });
    return NextResponse.json({ meetings: list });
  }

  if (userType === 'Nanny' && airtableNannyId) {
    const requests = await getInterviewRequestsByNanny(airtableNannyId);
    const meetings = requests.filter((r) => r.status === 'meeting_created');
    const list = await Promise.all(
      meetings.map(async (ir) => {
        const host = ir.hostId ? await getHost(ir.hostId) : null;
        const otherPartyName = host
          ? [host.firstName, host.lastName].filter(Boolean).join(' ') || 'Family'
          : 'Family';
        const dateTime = getSelectedSlotDateTime(ir);
        return {
          id: ir.id,
          matchId: ir.matchId,
          interviewRequestId: ir.id,
          dateTime: dateTime ?? undefined,
          otherPartyName,
          googleMeetLink: ir.googleMeetLink ?? undefined,
        };
      })
    );
    list.sort((a, b) => {
      if (!a.dateTime || !b.dateTime) return 0;
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    });
    return NextResponse.json({ meetings: list });
  }

  return NextResponse.json({ meetings: [] });
}
