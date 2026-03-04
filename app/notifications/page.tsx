import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui';
import NotificationsList from './NotificationsList';

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/notifications');

  const userType = (session.user as { userType?: string }).userType;
  const dashboardHref = userType === 'Nanny' ? '/nanny/dashboard' : '/host/dashboard';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">Notifications</h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Your recent notifications. Unread ones appear first.
      </p>
      <NotificationsList dashboardHref={dashboardHref} />
    </div>
  );
}
