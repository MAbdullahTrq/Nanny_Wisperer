/**
 * Airtable InterviewRequests. Stub for T1; full implementation in T8.1.
 */

export async function getInterviewByMatchId(_matchId: string): Promise<unknown> {
  return null;
}

export async function updateInterviewWithZoom(
  _interviewId: string,
  _calendarEventIdOrId: string,
  _joinUrl?: string,
  _startUrl?: string
): Promise<void> {}

export async function updateInterviewRequest(
  _interviewId: string,
  _fields: Record<string, unknown>
): Promise<void> {}
