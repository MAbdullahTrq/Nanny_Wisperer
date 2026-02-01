import { NextResponse } from 'next/server';
import { createResetToken } from '@/lib/airtable/password-reset';
import { getUserByEmail } from '@/lib/airtable/users';
import { validateEmail } from '@/lib/auth/password';
import { config } from '@/lib/config';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.trim()?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a reset link.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await createResetToken(email, token, expiresAt);

    const resetUrl = `${config.app.url}/reset-password?token=${encodeURIComponent(token)}`;
    if (config.app.nodeEnv === 'development') {
      console.log('[Forgot password] Reset link:', resetUrl);
    }
    // TODO: Send email via Resend/Nodemailer: await sendEmail({ to: email, subject: 'Reset password', html: `...${resetUrl}...` });

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a reset link.',
    });
  } catch (e) {
    console.error('Forgot password error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
