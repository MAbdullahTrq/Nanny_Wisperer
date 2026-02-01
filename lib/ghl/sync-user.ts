/**
 * Sync app user to GHL contact. T4.5 — create/update GHL contact and return ghlContactId.
 */

import { config } from '@/lib/config';
import { ghlClient } from './client';
import type { UserType } from '@/types/airtable';

export interface SyncUserToGHLParams {
  email: string;
  name?: string;
  userType: UserType;
  ghlContactId?: string;
}

/**
 * Create or update GHL contact for this user. Returns ghlContactId or null if GHL is not configured or fails.
 */
export async function syncUserToGHL(params: SyncUserToGHLParams): Promise<string | null> {
  if (!config.ghl.apiKey || !config.ghl.accountId) {
    return null;
  }
  try {
    const name = params.name ?? params.email;
    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lastName = rest.join(' ') || undefined;
    const contact = await ghlClient.createOrUpdateContact({
      id: params.ghlContactId,
      locationId: config.ghl.accountId,
      email: params.email,
      name,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      userType: params.userType,
    });
    const id =
      (contact as { id?: string }).id ??
      (contact as { contact?: { id?: string } }).contact?.id ??
      null;
    return id;
  } catch (e) {
    console.error('GHL sync user error:', e);
    return null;
  }
}
