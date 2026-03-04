import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createReportedIssue } from '@/lib/db/reported-issues';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { subject?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { subject, description } = body;
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return NextResponse.json({ error: 'subject is required' }, { status: 400 });
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }

  const userId = (session.user as { userId?: string }).userId;
  if (!userId) {
    return NextResponse.json({ error: 'User id not found' }, { status: 400 });
  }

  try {
    const issue = await createReportedIssue({
      userId,
      userEmail: session.user.email,
      subject: subject.trim().slice(0, 500),
      description: description.trim().slice(0, 5000),
    });
    return NextResponse.json({ success: true, issue: { id: issue.id, status: issue.status } });
  } catch (e) {
    console.error('Create reported issue error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to submit' },
      { status: 500 }
    );
  }
}
