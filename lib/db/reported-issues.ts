/**
 * SQL Reported issues table. User-submitted issues; admin list and update status.
 */

import { query } from './pool';

export type ReportedIssueStatus = 'Open' | 'In Progress' | 'Resolved';

export interface ReportedIssue {
  id: string;
  createdTime: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  status: ReportedIssueStatus;
}

function rowToIssue(row: Record<string, unknown>): ReportedIssue {
  return {
    id: row.id as string,
    createdTime: new Date(row.created_time as string).toISOString(),
    userId: row.user_id as string,
    userEmail: row.user_email as string,
    subject: row.subject as string,
    description: row.description as string,
    status: (row.status as ReportedIssueStatus) ?? 'Open',
  };
}

export async function createReportedIssue(data: {
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
}): Promise<ReportedIssue> {
  const { rows } = await query<Record<string, unknown>>(
    `INSERT INTO reported_issues (user_id, user_email, subject, description, status)
     VALUES ($1, $2, $3, $4, 'Open') RETURNING *`,
    [data.userId, data.userEmail, data.subject, data.description]
  );
  return rowToIssue(rows[0]!);
}

export async function getReportedIssues(params?: {
  status?: ReportedIssueStatus;
  limit?: number;
}): Promise<ReportedIssue[]> {
  let sql = 'SELECT * FROM reported_issues';
  const values: unknown[] = [];
  let n = 1;
  if (params?.status) {
    sql += ` WHERE status = $${n++}`;
    values.push(params.status);
  }
  sql += ' ORDER BY created_time DESC';
  const limit = params?.limit ?? 200;
  sql += ` LIMIT $${n}`;
  values.push(limit);
  const { rows } = await query<Record<string, unknown>>(sql, values);
  return rows.map(rowToIssue);
}

export async function getReportedIssueById(id: string): Promise<ReportedIssue | null> {
  const { rows } = await query<Record<string, unknown>>(
    'SELECT * FROM reported_issues WHERE id = $1 LIMIT 1',
    [id]
  );
  if (rows.length === 0) return null;
  return rowToIssue(rows[0]!);
}

export async function updateReportedIssueStatus(
  id: string,
  status: ReportedIssueStatus
): Promise<ReportedIssue | null> {
  const { rows } = await query<Record<string, unknown>>(
    'UPDATE reported_issues SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  if (rows.length === 0) return null;
  return rowToIssue(rows[0]!);
}
