import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getNanny, createNanny, updateNanny } from '@/lib/airtable/nannies';
import { updateUser } from '@/lib/airtable/users';
import { validateNannyOnboarding, validateNannyOnboardingSegment, type NannyOnboardingSegmentId } from '@/lib/validation/nanny-onboarding';

/** Nanny fields that are Long text in Airtable; send string, not object/array. */
const NANNY_LONG_TEXT_KEYS = new Set(['languageSkills', 'locationPreferences', 'specialNeedsDetails', 'dietaryDetails', 'aboutMe']);

/** Nanny checkbox fields; Airtable expects boolean. */
const NANNY_CHECKBOX_KEYS = new Set([
  'hasChildcareExperience', 'hasDrivingLicence', 'smokes', 'vegetarianOrVegan',
  'finishDateOngoing', 'availableWeekends', 'specialNeedsExperience',
  'canCook', 'tutoringHomework', 'lightHousekeeping', 'okToTravelAndSupport',
  'comfortableWithPets', 'strongReligiousBeliefs', 'dietaryRestrictions',
  'willingToCookNonVegetarian', 'euAuPairHoursAcknowledged',
]);

function toAirtableFields(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (NANNY_LONG_TEXT_KEYS.has(k) && (typeof v === 'object' || Array.isArray(v))) {
      out[k] = JSON.stringify(v);
      continue;
    }
    if (NANNY_CHECKBOX_KEYS.has(k)) {
      out[k] = v === true || (typeof v === 'string' && v.toLowerCase() === 'true');
      continue;
    }
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const segmentId = body.segment as NannyOnboardingSegmentId | undefined;
  if (segmentId) {
    const { segment, ...payload } = body;
    const validated = validateNannyOnboardingSegment(segmentId, payload);
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
      return NextResponse.json({ success: true, nannyId, segment: segmentId });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Nanny onboarding segment error:', e);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.', detail: message },
        { status: 500 }
      );
    }
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
    const message = e instanceof Error ? e.message : String(e);
    console.error('Nanny onboarding error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.', detail: message },
      { status: 500 }
    );
  }
}
