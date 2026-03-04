/**
 * SQL Notifications table. In-app notifications for host/nanny (shortlist, both proceeded, interview, meeting).
 */

import { query } from './pool';

export interface Notification {
  id: string;
  createdTime: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
}

function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    createdTime: new Date(row.created_time as string).toISOString(),
    userId: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    message: (row.message as string) ?? null,
    link: (row.link as string) ?? null,
    read: Boolean(row.read),
  };
}

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}): Promise<Notification> {
  const { rows } = await query<Record<string, unknown>>(
    `INSERT INTO notifications (user_id, type, title, message, link, read)
     VALUES ($1, $2, $3, $4, $5, false) RETURNING *`,
    [
      data.userId,
      data.type,
      data.title,
      data.message ?? null,
      data.link ?? null,
    ]
  );
  return rowToNotification(rows[0]!);
}

export async function getUnreadNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM notifications WHERE user_id = $1 AND read = false ORDER BY created_time DESC LIMIT $2',
    [userId, limit]
  );
  return rows.map(rowToNotification);
}

export async function getNotificationById(id: string): Promise<Notification | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM notifications WHERE id = $1 LIMIT 1',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToNotification(rows[0]!);
}

export async function markNotificationRead(id: string, userId: string): Promise<Notification | null> {
  const { rows } = await query<Record<string, unknown>>(
    'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  if (rows.length === 0) return null;
  return rowToNotification(rows[0]!);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1 AND read = false',
    [userId]
  );
  return (rows[0]?.c as number) ?? 0;
}
