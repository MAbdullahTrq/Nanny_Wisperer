import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getUserByEmail, createUser, updateUser } from '@/lib/db/users';
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth/password';
import { syncUserToGHL } from '@/lib/ghl/sync-user';
import { sendSignupToGHLInbound } from '@/lib/ghl/inbound-webhook';
import { createVerificationToken } from '@/lib/db/email-verification';
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import type { UserType } from '@/types/airtable';

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
    if (!config.database.url) {
      console.error('Signup: DATABASE_URL is not set');
      return NextResponse.json(
        { error: 'Signup is not configured. Please contact support.' },
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
    const isDb = err.message.includes('DATABASE') || err.message.includes('connection') || err.message.includes('ECONNREFUSED');
    const message = isDb
      ? 'Signup is temporarily unavailable. Please try again later or contact support.'
      : 'Something went wrong. Please try again.';
    return NextResponse.json(
      { error: message },
      { status: isDb ? 503 : 500 }
    );
  }
}
