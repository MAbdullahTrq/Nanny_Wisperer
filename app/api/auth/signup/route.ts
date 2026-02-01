import { NextResponse } from 'next/server';
import { getUserByEmail, createUser, updateUser } from '@/lib/airtable/users';
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth/password';
import { syncUserToGHL } from '@/lib/ghl/sync-user';
import type { UserType } from '@/types/airtable';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, userType } = body as {
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

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      userType: user.userType,
    });
  } catch (e) {
    console.error('Signup error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
