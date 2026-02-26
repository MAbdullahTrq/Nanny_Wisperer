/**
 * Airtable Users table. Fields: email, name, userType (Host|Nanny), passwordHash,
 * ghlContactId, airtableHostId, airtableNannyId, emailVerified, createdTime.
 */

import { config } from '@/lib/config';
import { airtableGet, airtableGetRecord, airtableCreate, airtableUpdate } from './client';
import type { User, UserType } from '@/types/airtable';

const USERS_TABLE = () => config.airtable.usersTableName;

function recordToUser(record: { id: string; fields: Record<string, unknown>; createdTime?: string }): User {
  const f = record.fields;
  return {
    id: record.id,
    email: (f.email as string) ?? '',
    name: (f.name as string) ?? undefined,
    userType: (f.userType as UserType) ?? 'Host',
    passwordHash: (f.passwordHash as string) ?? undefined,
    ghlContactId: (f.ghlContactId as string) ?? undefined,
    airtableHostId: (f.airtableHostId as string) ?? undefined,
    airtableNannyId: (f.airtableNannyId as string) ?? undefined,
    emailVerified: Boolean(f.emailVerified),
    isAdmin: Boolean(f.isAdmin),
    isMatchmaker: Boolean(f.isMatchmaker),
    locked: Boolean(f.locked),
    createdTime: record.createdTime ?? f.createdTime as string,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { records } = await airtableGet<Record<string, unknown>>(USERS_TABLE(), {
    filterByFormula: `{email} = "${email.replace(/"/g, '\\"')}"`,
    maxRecords: 1,
  });
  if (records.length === 0) return null;
  return recordToUser(records[0] as { id: string; fields: Record<string, unknown>; createdTime?: string });
}

export async function getUserById(id: string): Promise<User | null> {
  const record = await airtableGetRecord<Record<string, unknown>>(USERS_TABLE(), id);
  if (!record) return null;
  return recordToUser(record as { id: string; fields: Record<string, unknown>; createdTime?: string });
}

export async function createUser(data: {
  email: string;
  name?: string;
  userType: UserType;
  passwordHash?: string;
  ghlContactId?: string;
}): Promise<User> {
  const fields: Record<string, unknown> = {
    email: data.email,
    name: data.name ?? '',
    userType: data.userType,
  };
  if (data.passwordHash) fields.passwordHash = data.passwordHash;
  if (data.ghlContactId) fields.ghlContactId = data.ghlContactId;
  fields.emailVerified = false;

  // #region agent log (Vercel: see Function logs in dashboard)
  const logA = { location: 'lib/airtable/users.ts:createUser', message: 'createUser fields before airtableCreate', data: { emailVerified: fields.emailVerified, emailVerifiedType: typeof fields.emailVerified, fieldsKeys: Object.keys(fields), emailVerifiedInStringify: JSON.stringify(fields).includes('"false"') }, hypothesisId: 'A' };
  console.log('[debug]', JSON.stringify(logA));
  // #endregion

  const created = await airtableCreate(USERS_TABLE(), fields);
  return recordToUser(created as { id: string; fields: Record<string, unknown>; createdTime?: string });
}

export async function updateUser(
  id: string,
  fields: Partial<Pick<User, 'name' | 'userType' | 'passwordHash' | 'ghlContactId' | 'airtableHostId' | 'airtableNannyId' | 'emailVerified' | 'isAdmin' | 'isMatchmaker' | 'locked'>>
): Promise<User> {
  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.userType !== undefined) update.userType = fields.userType;
  if (fields.passwordHash !== undefined) update.passwordHash = fields.passwordHash;
  if (fields.ghlContactId !== undefined) update.ghlContactId = fields.ghlContactId;
  if (fields.airtableHostId !== undefined) update.airtableHostId = fields.airtableHostId;
  if (fields.airtableNannyId !== undefined) update.airtableNannyId = fields.airtableNannyId;
  if (fields.emailVerified !== undefined) update.emailVerified = fields.emailVerified;
  if (fields.isAdmin !== undefined) update.isAdmin = fields.isAdmin;
  if (fields.isMatchmaker !== undefined) update.isMatchmaker = fields.isMatchmaker;
  if (fields.locked !== undefined) update.locked = fields.locked;

  const updated = await airtableUpdate(USERS_TABLE(), id, update);
  return recordToUser(updated as { id: string; fields: Record<string, unknown>; createdTime?: string });
}
