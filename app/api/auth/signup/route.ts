import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getUserByEmail, createUser, updateUser } from '@/lib/airtable/users';
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth/password';
import { syncUserToGHL } from '@/lib/ghl/sync-user';
import { sendSignupToGHLInbound } from '@/lib/ghl/inbound-webhook';
import { createVerificationToken } from '@/lib/airtable/email-verification';
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import type { UserType } from '@/types/airtable';

/** Airtable base IDs start with "app"; table IDs start with "tbl". Using a table ID as base causes 404. */
function isLikelyBaseId(id: string): boolean {
  const trimmed = (id || '').trim();
  return trimmed.length > 0 && trimmed.toLowerCase().startsWith('app');
}

/** Quick Airtable connectivity check; returns null if ok, or error message if not. */
async function checkAirtableAccess(): Promise<{ ok: true } | { ok: false; status: number; text: string }> {
  const apiKey = config.airtable.apiKey;
  const baseId = (config.airtable.baseId || '').trim();
  const tableName = (config.airtable.usersTableName || 'Users').trim();
  if (!apiKey || !baseId) return { ok: false, status: 0, text: 'Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID' };
  if (!isLikelyBaseId(baseId)) {
    console.error('Signup: AIRTABLE_BASE_ID should be a base ID (starts with "app"), not a table ID. Get it from your base URL: airtable.com/appXXXXXXXX/...');
    return { ok: false, status: 404, text: 'AIRTABLE_BASE_ID should start with "app" (base ID from base URL)' };
  }
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (res.ok) return { ok: true };
  const text = await res.text();
  if (res.status === 404) {
    console.error('Signup: Airtable 404. baseId=' + baseId.slice(0, 12) + '... tableName=' + JSON.stringify(tableName) + '. Ensure: (1) Base ID is from base URL (starts with app), (2) PAT has access to this base, (3) Table name matches exactly.');
  }
  return { ok: false, status: res.status, text };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  try {
    if (!config.airtable.apiKey || !config.airtable.baseId) {
      console.error('Signup: Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
      return NextResponse.json(
        { error: 'Signup is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const airtableCheck = await checkAirtableAccess();
    if (!airtableCheck.ok) {
      const hint =
        airtableCheck.status === 401
          ? 'Invalid Airtable token (check AIRTABLE_API_KEY).'
          : airtableCheck.status === 404
            ? airtableCheck.text.includes('start with')
              ? airtableCheck.text
              : `Base or table not found. Use base ID from URL (starts with "app"). Ensure your Personal Access Token has access to this base and table "${config.airtable.usersTableName}" exists.`
            : `Airtable returned ${airtableCheck.status}.`;
      console.error('Signup: Airtable check failed', airtableCheck.status, airtableCheck.text, hint);
      return NextResponse.json(
        { error: 'Signup is temporarily unavailable. Please try again later or contact support.' },
        { status: 503 }
      );
    }

    const { email, name, password, userType } = (body && typeof body === 'object' ? body : {}) as {
      email?: string;
      name?: string;
      password?: string;
      userType?: UserType;
    };

    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: 'Email, password, and user type are required.' },
        { status: 400 }
      );
    }
    if (userType !== 'Host' && userType !== 'Nanny') {
      return NextResponse.json(
        { error: 'userType must be Host or Nanny.' },
        { status: 400 }
      );
    }
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      name: name || email,
      userType,
      passwordHash,
    });

    const ghlContactId = await syncUserToGHL({
      email,
      name: name || email,
      userType,
    });
    if (ghlContactId && user.id) {
      await updateUser(user.id, { ghlContactId });
    }

    await sendSignupToGHLInbound({
      email,
      name: name || email,
      signupType: userType,
      userId: user.id,
      source: 'nanny-whisperer',
    });

    const displayName = name || email;

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail({ to: email, name: displayName, userType }).catch(() => {});

    // Send email verification (fire-and-forget)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    createVerificationToken(email, verificationToken, verificationExpires)
      .then(() => sendVerificationEmail({ to: email, name: displayName, token: verificationToken }))
      .catch((err) => console.error('Verification email error:', err));

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      userType: user.userType,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('Signup error:', err.message, err.stack ?? err);
    const isAirtable = err.message.includes('Airtable');
    const message = isAirtable
      ? 'Signup is temporarily unavailable. Please try again later or contact support.'
      : 'Something went wrong. Please try again.';
    return NextResponse.json(
      { error: message },
      { status: isAirtable ? 503 : 500 }
    );
  }
}
