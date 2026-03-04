/**
 * SQL Conversations and Messages. Same API as lib/airtable/chat.
 */

import type { Conversation, Message, SenderType } from '@/types/airtable';
import { query } from './pool';

function rowToConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    createdTime: row.created_time != null ? new Date(row.created_time as string).toISOString() : undefined,
    matchId: row.match_id as string,
    hostId: row.host_id as string,
    nannyId: row.nanny_id as string,
  };
}

function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    createdTime: row.created_time != null ? new Date(row.created_time as string).toISOString() : undefined,
    conversationId: row.conversation_id as string,
    senderId: row.sender_id as string,
    senderType: row.sender_type as SenderType,
    content: row.content as string,
    attachmentUrl: row.attachment_url as string | undefined,
  };
}

export async function createConversation(
  matchId: string,
  hostId: string,
  nannyId: string
): Promise<Conversation & { id: string }> {
  const { rows } = await query<Record<string, unknown>>(
    'INSERT INTO conversations (match_id, host_id, nanny_id) VALUES ($1, $2, $3) RETURNING *',
    [matchId, hostId, nannyId]
  );
  const c = rowToConversation(rows[0]!);
  return { ...c, id: rows[0]!.id as string };
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM conversations WHERE id = $1 LIMIT 1',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToConversation(rows[0]!);
}

export async function getConversationByMatchId(matchId: string): Promise<Conversation | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM conversations WHERE match_id = $1 LIMIT 1',
    [matchId]
  );
  if (rows.length === 0) return null;
  return rowToConversation(rows[0]!);
}

export async function getConversationsByHost(hostId: string): Promise<Conversation[]> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM conversations WHERE host_id = $1 ORDER BY created_time DESC',
    [hostId]
  );
  return rows.map((r) => rowToConversation(r));
}

export async function getConversationsByNanny(nannyId: string): Promise<Conversation[]> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM conversations WHERE nanny_id = $1 ORDER BY created_time DESC',
    [nannyId]
  );
  return rows.map((r) => rowToConversation(r));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_time ASC',
    [conversationId]
  );
  return rows.map((r) => rowToMessage(r));
}

export async function addMessage(
  conversationId: string,
  senderId: string,
  senderType: SenderType,
  content: string,
  attachmentUrl?: string
): Promise<Message & { id: string }> {
  const { rows } = await query<Record<string, unknown>>(
    'INSERT INTO messages (conversation_id, sender_id, sender_type, content, attachment_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [conversationId, senderId, senderType, content, attachmentUrl ?? null]
  );
  const m = rowToMessage(rows[0]!);
  return { ...m, id: rows[0]!.id as string };
}

export async function getLastMessage(conversationId: string): Promise<Message | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_time DESC LIMIT 1',
    [conversationId]
  );
  if (rows.length === 0) return null;
  return rowToMessage(rows[0]!);
}
