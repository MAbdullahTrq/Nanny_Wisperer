import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getNanny, createNanny, updateNanny } from '@/lib/airtable/nannies';
import { updateUser } from '@/lib/airtable/users';
import { validateNannyOnboarding } from '@/lib/validation/nanny-onboarding';

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
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  if (userType !== 'Nanny' || !userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!airtableNannyId) {
    return NextResponse.json({ nanny: null });
  }
  const nanny = await getNanny(airtableNannyId);
  return NextResponse.json({ nanny });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { userId?: string }).userId;
  const userType = (session.user as { userType?: string }).userType;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  if (userType !== 'Nanny' || !userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validated = validateNannyOnboarding(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validated.error.flatten() },
      { status: 400 }
    );
  }

  const fields = toAirtableFields({ ...validated.data, userId } as Record<string, unknown>);

  try {
    let nannyId: string;
    if (airtableNannyId) {
      await updateNanny(airtableNannyId, fields);
      nannyId = airtableNannyId;
    } else {
      const created = await createNanny(fields);
      nannyId = created.id!;
      await updateUser(userId, { airtableNannyId: nannyId });
    }
    return NextResponse.json({ success: true, nannyId });
  } catch (e) {
    console.error('Nanny onboarding error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
