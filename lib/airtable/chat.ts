/**
 * Airtable Conversations and Messages. T7.1 — chat schema and API.
 */

import type { Conversation, Message, SenderType } from '@/types/airtable';
import { airtableCreate, airtableGet, airtableGetRecord } from './client';

const CONVERSATIONS_TABLE = 'Conversations';
const MESSAGES_TABLE = 'Messages';

function recordToConversation(record: {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}): Conversation {
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...record.fields,
  } as Conversation;
}

function recordToMessage(record: {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}): Message {
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...record.fields,
  } as Message;
}

export async function createConversation(
  matchId: string,
  hostId: string,
  nannyId: string
): Promise<Conversation & { id: string }> {
  const created = await airtableCreate(CONVERSATIONS_TABLE, {
    matchId,
    hostId,
    nannyId,
  } as Record<string, unknown>);
  return { ...recordToConversation(created), id: created.id };
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const record = await airtableGetRecord<Record<string, unknown>>(CONVERSATIONS_TABLE, id);
  if (!record) return null;
  return recordToConversation(record);
}

export async function getConversationByMatchId(matchId: string): Promise<Conversation | null> {
  const { records } = await airtableGet<Record<string, unknown>>(CONVERSATIONS_TABLE, {
    filterByFormula: `{matchId} = '${matchId.replace(/'/g, "\\'")}'`,
    maxRecords: 1,
  });
  if (records.length === 0) return null;
  return recordToConversation(records[0]);
}

export async function getConversationsByHost(hostId: string): Promise<Conversation[]> {
  const { records } = await airtableGet<Record<string, unknown>>(CONVERSATIONS_TABLE, {
    filterByFormula: `{hostId} = '${hostId.replace(/'/g, "\\'")}'`,
    maxRecords: 100,
  });
  return records.map((r) => recordToConversation(r));
}

export async function getConversationsByNanny(nannyId: string): Promise<Conversation[]> {
  const { records } = await airtableGet<Record<string, unknown>>(CONVERSATIONS_TABLE, {
    filterByFormula: `{nannyId} = '${nannyId.replace(/'/g, "\\'")}'`,
    maxRecords: 100,
  });
  return records.map((r) => recordToConversation(r));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { records } = await airtableGet<Record<string, unknown>>(MESSAGES_TABLE, {
    filterByFormula: `{conversationId} = '${conversationId.replace(/'/g, "\\'")}'`,
    maxRecords: 200,
  });
  return records
    .map((r) => recordToMessage(r))
    .sort((a, b) => {
      const t1 = a.createdTime ?? '';
      const t2 = b.createdTime ?? '';
      return t1.localeCompare(t2);
    });
}

export async function addMessage(
  conversationId: string,
  senderId: string,
  senderType: SenderType,
  content: string,
  attachmentUrl?: string
): Promise<Message & { id: string }> {
  const fields: Record<string, unknown> = {
    conversationId,
    senderId,
    senderType,
    content,
  };
  if (attachmentUrl) fields.attachmentUrl = attachmentUrl;
  const created = await airtableCreate(MESSAGES_TABLE, fields);
  return { ...recordToMessage(created), id: created.id };
}

export async function getLastMessage(conversationId: string): Promise<Message | null> {
  const messages = await getMessages(conversationId);
  return messages.length > 0 ? messages[messages.length - 1]! : null;
}
