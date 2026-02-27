import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/airtable/users';
import { createVerificationToken } from '@/lib/airtable/email-verification';
import { validateEmail } from '@/lib/auth/password';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.trim()?.toLowerCase();

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a verification link will be sent.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await createVerificationToken(email, token, expiresAt);

    await sendVerificationEmail({
      to: email,
      name: user.name || email,
      token,
    });

    return NextResponse.json({
      message: 'If an account exists with this email, a verification link will be sent.',
    });
  } catch (e) {
    console.error('Resend verification error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
