import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * After login, redirect to the correct dashboard: admin/matchmaker first, then by userType.
 */
export default async function AuthRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }
  const u = session.user as { userType?: string; isAdmin?: boolean; isMatchmaker?: boolean };
  if (u.isAdmin) redirect('/admin');
  if (u.isMatchmaker) redirect('/matchmaker');
  if (u.userType === 'Nanny') redirect('/nanny/dashboard');
  if (u.userType === 'Host') redirect('/host/dashboard');
  redirect('/signup');
}
