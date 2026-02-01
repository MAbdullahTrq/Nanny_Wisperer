import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getHost, createHost, updateHost } from '@/lib/airtable/hosts';
import { updateUser } from '@/lib/airtable/users';
import { validateHostOnboarding } from '@/lib/validation/host-onboarding';

/** Build Airtable fields from validated input (omit empty strings, undefined). */
function toAirtableFields(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { userId?: string }).userId;
  const userType = (session.user as { userType?: string }).userType;
  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  if (userType !== 'Host' || !userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!airtableHostId) {
    return NextResponse.json({ host: null });
  }
  const host = await getHost(airtableHostId);
  return NextResponse.json({ host });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { userId?: string }).userId;
  const userType = (session.user as { userType?: string }).userType;
  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  if (userType !== 'Host' || !userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validated = validateHostOnboarding(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validated.error.flatten() },
      { status: 400 }
    );
  }

  const fields = toAirtableFields({ ...validated.data, userId } as Record<string, unknown>);

  try {
    let hostId: string;
    if (airtableHostId) {
      await updateHost(airtableHostId, fields);
      hostId = airtableHostId;
    } else {
      const created = await createHost(fields);
      hostId = created.id!;
      await updateUser(userId, { airtableHostId: hostId });
    }
    return NextResponse.json({ success: true, hostId });
  } catch (e) {
    console.error('Host onboarding error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
