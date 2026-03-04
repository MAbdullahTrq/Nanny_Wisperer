/**
 * SQL InterviewRequests table. Same API as lib/airtable/interview-requests.
 */

import type { InterviewRequest, InterviewRequestStatus } from '@/types/airtable';
import { query } from './pool';

function rowToInterviewRequest(row: Record<string, unknown>): InterviewRequest {
  return {
    id: row.id as string,
    createdTime: row.created_time != null ? new Date(row.created_time as string).toISOString() : undefined,
    matchId: row.match_id as string,
    hostId: row.host_id as string,
    nannyId: row.nanny_id as string,
    slot1: row.slot1 as string | undefined,
    slot2: row.slot2 as string | undefined,
    slot3: row.slot3 as string | undefined,
    slot4: row.slot4 as string | undefined,
    slot5: row.slot5 as string | undefined,
    selectedSlotIndex: row.selected_slot_index != null ? Number(row.selected_slot_index) : undefined,
    googleMeetLink: row.google_meet_link as string | undefined,
    googleCalendarEventId: row.google_calendar_event_id as string | undefined,
    status: row.status as InterviewRequestStatus,
    isVip: Boolean(row.is_vip),
  };
}

export interface CreateInterviewRequestInput {
  matchId: string;
  hostId: string;
  nannyId: string;
  slot1: string;
  slot2: string;
  slot3: string;
  slot4: string;
  slot5: string;
  isVip?: boolean;
}

export async function createInterviewRequest(data: CreateInterviewRequestInput): Promise<InterviewRequest & { id: string }> {
  const { rows } = await query<Record<string, unknown>>(
    'INSERT INTO interview_requests (match_id, host_id, nanny_id, slot1, slot2, slot3, slot4, slot5, status, is_vip) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
    [data.matchId, data.hostId, data.nannyId, data.slot1, data.slot2, data.slot3, data.slot4, data.slot5, 'pending_slots', Boolean(data.isVip)]
  );
  const ir = rowToInterviewRequest(rows[0]!);
  return { ...ir, id: rows[0]!.id as string };
}

export async function getInterviewRequestById(id: string): Promise<InterviewRequest | null> {
  const { rows } = await query<Record<string, unknown>>('SELECT * FROM interview_requests WHERE id = $1 LIMIT 1', [id]);
  if (rows.length === 0) return null;
  return rowToInterviewRequest(rows[0]!);
}

export async function getInterviewRequestByMatchId(matchId: string): Promise<InterviewRequest | null> {
  const { rows } = await query<Record<string, unknown>>('SELECT * FROM interview_requests WHERE match_id = $1 LIMIT 1', [matchId]);
  if (rows.length === 0) return null;
  return rowToInterviewRequest(rows[0]!);
}

export async function getInterviewRequests(params?: { maxRecords?: number }): Promise<InterviewRequest[]> {
  const limit = params?.maxRecords ?? 200;
  const { rows } = await query<Record<string, unknown>>('SELECT * FROM interview_requests ORDER BY created_time DESC LIMIT $1', [limit]);
  return rows.map((r) => rowToInterviewRequest(r));
}

export async function getInterviewRequestsByHost(hostId: string): Promise<InterviewRequest[]> {
  const { rows } = await query<Record<string, unknown>>('SELECT * FROM interview_requests WHERE host_id = $1 ORDER BY created_time DESC', [hostId]);
  return rows.map((r) => rowToInterviewRequest(r));
}

export async function getInterviewRequestsByNanny(nannyId: string): Promise<InterviewRequest[]> {
  const { rows } = await query<Record<string, unknown>>('SELECT * FROM interview_requests WHERE nanny_id = $1 ORDER BY created_time DESC', [nannyId]);
  return rows.map((r) => rowToInterviewRequest(r));
}

type UpdateFields = Partial<{
  selectedSlotIndex: number;
  googleMeetLink: string;
  googleCalendarEventId: string;
  status: InterviewRequestStatus;
}>;

export async function updateInterviewRequest(id: string, fields: UpdateFields): Promise<InterviewRequest> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let n = 1;
  if (fields.selectedSlotIndex !== undefined) { updates.push('selected_slot_index = $' + n++); values.push(fields.selectedSlotIndex); }
  if (fields.googleMeetLink !== undefined) { updates.push('google_meet_link = $' + n++); values.push(fields.googleMeetLink); }
  if (fields.googleCalendarEventId !== undefined) { updates.push('google_calendar_event_id = $' + n++); values.push(fields.googleCalendarEventId); }
  if (fields.status !== undefined) { updates.push('status = $' + n++); values.push(fields.status); }
  if (updates.length === 0) {
    const ir = await getInterviewRequestById(id);
    if (!ir) throw new Error('Interview request not found');
    return ir;
  }
  values.push(id);
  const { rows } = await query<Record<string, unknown>>(
    'UPDATE interview_requests SET ' + updates.join(', ') + ' WHERE id = $' + n + ' RETURNING *',
    values
  );
  return rowToInterviewRequest(rows[0]!);
}
