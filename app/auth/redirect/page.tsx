import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * After login, redirect to the correct dashboard based on userType.
 */
export default async function AuthRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }
  const userType = (session.user as { userType?: string }).userType;
  if (userType === 'Nanny') redirect('/nanny/dashboard');
  if (userType === 'Host') redirect('/host/dashboard');
  redirect('/signup');
}
