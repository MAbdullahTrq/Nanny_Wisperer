/**
 * SQL wrapper for interview-requests (same API as lib/airtable/interviews).
 * getInterviewByMatchId -> getInterviewRequestByMatchId; update* delegate to interview-requests.
 */

import {
  getInterviewRequestByMatchId,
  updateInterviewRequest as updateInterviewRequestDb,
} from './interview-requests';

export async function getInterviewByMatchId(matchId: string): Promise<unknown> {
  return getInterviewRequestByMatchId(matchId);
}

export async function updateInterviewRequest(
  _interviewId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const id = _interviewId;
  await updateInterviewRequestDb(id, {
    selectedSlotIndex: fields.selectedSlotIndex as number | undefined,
    googleMeetLink: fields.googleMeetLink as string | undefined,
    googleCalendarEventId: fields.googleCalendarEventId as string | undefined,
    status: fields.status as Parameters<typeof updateInterviewRequestDb>[1]['status'],
  });
}

export async function updateInterviewWithZoom(
  interviewId: string,
  _calendarEventIdOrId: string,
  joinUrl?: string,
  _startUrl?: string
): Promise<void> {
  if (joinUrl) {
    await updateInterviewRequestDb(interviewId, { googleMeetLink: joinUrl });
  }
}
