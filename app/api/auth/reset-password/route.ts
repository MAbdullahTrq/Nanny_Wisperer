import { NextResponse } from 'next/server';
import { findValidResetToken, invalidateResetToken } from '@/lib/airtable/password-reset';
import { getUserByEmail, updateUser } from '@/lib/airtable/users';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { sendPasswordChangedEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body as { token?: string; password?: string };
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required.' },
        { status: 400 }
      );
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }

    const reset = await findValidResetToken(token);
    if (!reset) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(reset.email);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await updateUser(user.id, { passwordHash });
    await invalidateResetToken(token);

    // Notify user that password was changed (fire-and-forget)
    sendPasswordChangedEmail({
      to: user.email,
      name: user.name || user.email,
    }).catch(() => {});

    return NextResponse.json({
      message: 'Password updated. You can now log in.',
    });
  } catch (e) {
    console.error('Reset password error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
