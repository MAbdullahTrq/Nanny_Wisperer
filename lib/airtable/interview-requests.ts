/**
 * Airtable InterviewRequests table. T8.1 — create, getById, getByMatchId, update.
 */

import type { InterviewRequest, InterviewRequestStatus } from '@/types/airtable';
import { airtableCreate, airtableGet, airtableGetRecord, airtableUpdate } from './client';

const TABLE = 'InterviewRequests';

function recordToInterviewRequest(record: {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}): InterviewRequest {
  const f = record.fields;
  const slots = [
    f.slot1,
    f.slot2,
    f.slot3,
    f.slot4,
    f.slot5,
  ].filter(Boolean) as string[];
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...record.fields,
    slot1: slots[0],
    slot2: slots[1],
    slot3: slots[2],
    slot4: slots[3],
    slot5: slots[4],
    selectedSlotIndex: typeof f.selectedSlotIndex === 'number' ? f.selectedSlotIndex : undefined,
    status: f.status as InterviewRequestStatus | undefined,
    isVip: Boolean(f.isVip),
  } as InterviewRequest;
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

export async function createInterviewRequest(
  data: CreateInterviewRequestInput
): Promise<InterviewRequest & { id: string }> {
  const fields: Record<string, unknown> = {
    matchId: data.matchId,
    hostId: data.hostId,
    nannyId: data.nannyId,
    slot1: data.slot1,
    slot2: data.slot2,
    slot3: data.slot3,
    slot4: data.slot4,
    slot5: data.slot5,
    status: 'pending_slots',
    isVip: Boolean(data.isVip),
  };
  const created = await airtableCreate(TABLE, fields);
  return { ...recordToInterviewRequest(created), id: created.id };
}

export async function getInterviewRequestById(id: string): Promise<InterviewRequest | null> {
  const record = await airtableGetRecord<Record<string, unknown>>(TABLE, id);
  if (!record) return null;
  return recordToInterviewRequest(record);
}

export async function getInterviewRequestByMatchId(
  matchId: string
): Promise<InterviewRequest | null> {
  const { records } = await airtableGet<Record<string, unknown>>(TABLE, {
    filterByFormula: `{matchId} = '${matchId.replace(/'/g, "\\'")}'`,
    maxRecords: 1,
  });
  if (records.length === 0) return null;
  return recordToInterviewRequest(records[0]);
}

export async function updateInterviewRequest(
  id: string,
  fields: Partial<{
    selectedSlotIndex: number;
    googleMeetLink: string;
    googleCalendarEventId: string;
    status: InterviewRequestStatus;
  }>
): Promise<InterviewRequest> {
  const updated = await airtableUpdate(TABLE, id, fields as Record<string, unknown>);
  return recordToInterviewRequest(updated);
}
