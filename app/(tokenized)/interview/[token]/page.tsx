import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { validateToken } from '@/lib/auth/tokens';
import { getHost } from '@/lib/airtable/hosts';
import { getInterviewRequestByMatchId } from '@/lib/airtable/interview-requests';
import { filterSlotsByKayleyFree } from '@/lib/scheduling/calendar-overlap';
import HostSummary from '@/components/interview/HostSummary';
import InterviewClient from './InterviewClient';
import type { InterviewRequestStatus } from '@/types/airtable';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/** Format ISO slot string for display (e.g. "Wed, 30 Jan at 2:00 PM"). */
function formatSlotLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
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

interface PageProps {
  params: { token: string };
}

export default async function InterviewPage({ params }: PageProps) {
  try {
    const payload = validateToken(params.token);
    if (!payload || payload.type !== 'interview' || !payload.matchId || !payload.hostId || !payload.nannyId) {
      notFound();
    }

    const [host, interviewRequest] = await Promise.all([
      getHost(payload.hostId),
      getInterviewRequestByMatchId(payload.matchId),
    ]);

    if (!interviewRequest || !host) {
      notFound();
    }

    const hostFields = (host as { fields?: Record<string, unknown> }).fields ?? {};
    const status = (interviewRequest.status ?? 'pending_slots') as InterviewRequestStatus;
    const slotStrings = [
      interviewRequest.slot1,
      interviewRequest.slot2,
      interviewRequest.slot3,
      interviewRequest.slot4,
      interviewRequest.slot5,
    ].filter(Boolean) as string[];
    const isVip = Boolean(interviewRequest.isVip);

    let slotLabels: string[];
    let originalIndices: number[];
    let noSlotsMessage: string | undefined;

    if (isVip) {
      const filtered = await filterSlotsByKayleyFree(slotStrings);
      if (filtered.message) {
        slotLabels = [];
        originalIndices = [];
        noSlotsMessage = filtered.message;
      } else {
        originalIndices = filtered.slots.map((s) => slotStrings.indexOf(s));
        slotLabels = filtered.slots.map(formatSlotLabel);
      }
    } else {
      slotLabels = slotStrings.map(formatSlotLabel);
      originalIndices = slotStrings.map((_, i) => i);
    }

    const interviewRequestId = interviewRequest.id!;

    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)', maxWidth: '800px' }}>
        <HostSummary host={hostFields} />
        <InterviewClient
          interviewRequestId={interviewRequestId}
          token={params.token}
          slotLabels={slotLabels}
          originalIndices={originalIndices}
          status={status}
          noSlotsMessage={noSlotsMessage}
        />
      </div>
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('expired') || msg.includes('Invalid')) {
      notFound();
    }
    throw error;
  }
}
