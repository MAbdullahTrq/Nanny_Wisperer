import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getReportedIssueById, updateReportedIssueStatus } from '@/lib/db/reported-issues';
import type { ReportedIssueStatus } from '@/lib/db/reported-issues';

const VALID_STATUSES: ReportedIssueStatus[] = ['Open', 'In Progress', 'Resolved'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;
  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const status = body.status;
  if (!status || !VALID_STATUSES.includes(status as ReportedIssueStatus)) {
    return NextResponse.json(
      { error: 'status must be one of: Open, In Progress, Resolved' },
      { status: 400 }
    );
  }

  const existing = await getReportedIssueById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  try {
    const updated = await updateReportedIssueStatus(id, status as ReportedIssueStatus);
    return NextResponse.json({ success: true, issue: updated });
  } catch (e) {
    console.error('Update reported issue error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update' },
      { status: 500 }
    );
  }
}
