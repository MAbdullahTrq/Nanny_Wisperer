import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getInterviewRequestsByNanny } from '@/lib/db/interview-requests';
import { getHost } from '@/lib/db/hosts';
import { generateInterviewToken } from '@/lib/auth/tokens';
import { config } from '@/lib/config';

function formatSlot(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  if (!airtableNannyId) {
    return NextResponse.json({ interviewRequests: [] });
  }

  const requests = await getInterviewRequestsByNanny(airtableNannyId);
  const list = await Promise.all(
    requests.map(async (ir) => {
      const host = ir.hostId ? await getHost(ir.hostId) : null;
      const hostName = host
        ? [host.firstName, host.lastName].filter(Boolean).join(' ') || 'Family'
        : 'Family';
      const hostSummary = host
        ? [host.jobLocationPlace ?? host.city ?? host.country, host.childrenAndAges].filter(Boolean).join(' · ') || undefined
        : undefined;
      const slots = [ir.slot1, ir.slot2, ir.slot3, ir.slot4, ir.slot5].filter(Boolean) as string[];
      const slotLabels = slots.map(formatSlot);
      const status = ir.status ?? 'pending_slots';
      const token = generateInterviewToken(ir.matchId ?? '', ir.hostId, ir.nannyId);
      const selectSlotUrl = `${config.app.url}/interview/${token}`;

      return {
        id: ir.id,
        matchId: ir.matchId,
        hostName,
        hostSummary,
        slots: slotLabels,
        status,
        selectSlotUrl: status === 'pending_slots' || status === 'nanny_selected' ? selectSlotUrl : undefined,
        googleMeetLink: ir.googleMeetLink ?? undefined,
      };
    })
  );

  return NextResponse.json({ interviewRequests: list });
}
