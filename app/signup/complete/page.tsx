import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserByEmail, updateUser } from '@/lib/airtable/users';

/**
 * After Google sign-up: set userType from ?role= and redirect to dashboard.
 */
export default async function SignupCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const { role } = await searchParams;
  const userType = role === 'Nanny' ? 'Nanny' : 'Host';

  const user = await getUserByEmail(session.user.email);
  if (user && user.userType !== userType) {
    await updateUser(user.id!, { userType });
  }

  redirect('/auth/redirect');
}
