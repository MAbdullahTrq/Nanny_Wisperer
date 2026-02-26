import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;
  if (!session?.user || !isAdmin) redirect('/login?callbackUrl=/admin');

  const userType = (session.user as { userType?: string }).userType;
  const backToAppHref =
    userType === 'Host'
      ? '/host/dashboard'
      : userType === 'Nanny'
        ? '/nanny/dashboard'
        : '/';

  return (
    <div className="min-h-screen bg-off-white">
      <nav className="border-b border-dark-green/20 bg-white/90">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-display font-semibold text-dark-green">
            Admin
          </Link>
          <div className="flex gap-4 text-sm text-dark-green">
            <Link href="/admin" className="hover:underline">Overview</Link>
            <Link href="/admin/hosts" className="hover:underline">Hosts</Link>
            <Link href="/admin/caregivers" className="hover:underline">Caregivers</Link>
            <Link href="/admin/subscriptions" className="hover:underline">Subscriptions</Link>
            <Link href="/admin/issues" className="hover:underline">Reported issues</Link>
          </div>
          <Link href={backToAppHref} className="text-sm text-dark-green/80 hover:underline">Back to app</Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
