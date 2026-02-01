/**
 * VIP calendar overlap. T8.5 — filter host's 5 slots to only those where Kayley is free.
 */

import { config } from '@/lib/config';
import { getBusyIntervalsForCalendarWithEnvToken } from '@/lib/google/calendar';

/** Slot is an ISO datetime string (start of 30-min slot). */
function slotOverlapsBusy(slotIso: string, busyIntervals: Array<{ start: string; end: string }>): boolean {
  const slotStart = new Date(slotIso).getTime();
  const slotEnd = slotStart + 30 * 60 * 1000;
  for (const b of busyIntervals) {
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    if (slotStart < bEnd && slotEnd > bStart) return true;
  }
  return false;
}

/**
 * Filter host's 5 slot strings to only those where Kayley is free.
 * If Kayley calendar is not configured or we can't get busy, returns all slots (no filtering).
 */
export async function filterSlotsByKayleyFree(
  slotStrings: string[]
): Promise<{ slots: string[]; message?: string }> {
  const kayleyCalendarId = config.kayley.calendarId;
  const kayleyRefreshToken = config.kayley.refreshToken;

  if (!kayleyCalendarId || !kayleyRefreshToken) {
    return { slots: slotStrings };
  }

  const validSlots = slotStrings.filter(Boolean);
  if (validSlots.length === 0) return { slots: [] };

  const minDate = new Date(Math.min(...validSlots.map((s) => new Date(s).getTime())));
  const maxDate = new Date(Math.max(...validSlots.map((s) => new Date(s).getTime())));
  maxDate.setMinutes(maxDate.getMinutes() + 30);

  let busy: Array<{ start: string; end: string }>;
  try {
    busy = await getBusyIntervalsForCalendarWithEnvToken(
      kayleyCalendarId,
      kayleyRefreshToken,
      minDate,
      maxDate
    );
  } catch {
    return { slots: slotStrings };
  }

  const freeSlots = validSlots.filter((s) => !slotOverlapsBusy(s, busy));
  if (freeSlots.length === 0) {
    return {
      slots: [],
      message: 'No overlap with concierge; host will send new slots.',
    };
  }
  return { slots: freeSlots };
}
