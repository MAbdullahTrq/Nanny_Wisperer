/**
 * Zoom/Google Meet meetings. Stub for T1; full implementation in T9.
 */

export async function createMeeting(_params: unknown): Promise<{ meetLink: string }> {
  return { meetLink: '' };
}

export interface ZoomMeetingResult {
  id: string;
  join_url: string;
  start_url: string;
}

export async function createFastTrackMeeting(
  _hostId?: string,
  _nannyId?: string,
  _slotDate?: unknown
): Promise<ZoomMeetingResult> {
  return { id: '', join_url: '', start_url: '' };
}

export async function createVIPMeeting(
  _hostId?: string,
  _nannyId?: string,
  _kayleyId?: string,
  _slotDate?: unknown
): Promise<ZoomMeetingResult> {
  return { id: '', join_url: '', start_url: '' };
}
