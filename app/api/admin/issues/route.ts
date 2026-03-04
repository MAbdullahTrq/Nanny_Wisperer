import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getReportedIssues } from '@/lib/db/reported-issues';
import type { ReportedIssueStatus } from '@/lib/db/reported-issues';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;
  if (!session?.user || !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as ReportedIssueStatus | null;
  const validStatuses = ['Open', 'In Progress', 'Resolved'];
  const filterStatus =
    status && validStatuses.includes(status) ? status : undefined;

  try {
    const issues = await getReportedIssues({
      status: filterStatus,
      limit: 200,
    });
    return NextResponse.json({ issues });
  } catch (e) {
    console.error('List reported issues error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list issues' },
      { status: 500 }
    );
  }
}
