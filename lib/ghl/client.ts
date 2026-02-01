/**
 * GHL (GoHighLevel) API client. T3.3 — get contact, create/update contact.
 * Uses Contacts API v2: https://services.leadconnectorhq.com
 */

import { config } from '@/lib/config';

const GHL_BASE = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${config.ghl.apiKey}`,
    'Content-Type': 'application/json',
    Version: API_VERSION,
  };
}

export interface GHLContact {
  id?: string;
  locationId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  customFields?: Array<{ id?: string; key?: string; value?: string }>;
  [key: string]: unknown;
}

export interface GHLContactCreateUpdate {
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  customFields?: Array<{ id?: string; key?: string; value?: string }>;
}

/**
 * Get a contact by ID.
 */
export async function getContact(contactId: string): Promise<GHLContact | null> {
  const url = `${GHL_BASE}/contacts/${encodeURIComponent(contactId)}`;
  const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GHL getContact: ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * Create a new contact. Requires locationId (use config.ghl.accountId).
 */
export async function createContact(data: GHLContactCreateUpdate): Promise<GHLContact> {
  const url = `${GHL_BASE}/contacts/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`GHL createContact: ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * Update an existing contact by ID.
 */
export async function updateContact(
  contactId: string,
  data: Partial<Omit<GHLContactCreateUpdate, 'locationId'>>
): Promise<GHLContact> {
  const url = `${GHL_BASE}/contacts/${encodeURIComponent(contactId)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`GHL updateContact: ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * Create or update contact by email lookup (optional). For app use: create when no id, update when id present.
 */
export const ghlClient = {
  getContact,
  createContact,
  updateContact,
  createOrUpdateContact: async (data: {
    id?: string;
    locationId?: string;
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    userType?: string;
  }) => {
    const locationId = data.locationId || config.ghl.accountId;
    if (!locationId) throw new Error('GHL locationId (GHL_ACCOUNT_ID) is required');
    const payload: GHLContactCreateUpdate = {
      locationId,
      email: data.email,
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      customFields: data.userType
        ? [{ key: 'userType', value: data.userType }]
        : undefined,
    };
    if (data.id) return updateContact(data.id, payload);
    return createContact(payload);
  },
};
