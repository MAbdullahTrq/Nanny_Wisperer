import { NextResponse } from 'next/server';
import { findValidVerificationToken, invalidateVerificationToken } from '@/lib/airtable/email-verification';
import { getUserByEmail, updateUser } from '@/lib/airtable/users';
import { config } from '@/lib/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(`${config.app.url}/login?error=invalid-verification-link`);
    }

    const record = await findValidVerificationToken(token);
    if (!record) {
      return NextResponse.redirect(`${config.app.url}/login?error=expired-verification-link`);
    }

    const user = await getUserByEmail(record.email);
    if (!user?.id) {
      return NextResponse.redirect(`${config.app.url}/login?error=user-not-found`);
    }

    await updateUser(user.id, { emailVerified: true });
    await invalidateVerificationToken(token);

    return NextResponse.redirect(`${config.app.url}/login?verified=true`);
  } catch (e) {
    console.error('Email verification error:', e);
    return NextResponse.redirect(`${config.app.url}/login?error=verification-failed`);
  }
}
