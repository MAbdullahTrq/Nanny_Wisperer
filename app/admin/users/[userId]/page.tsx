import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUserById } from '@/lib/airtable/users';
import { getHost } from '@/lib/airtable/hosts';
import { getNanny } from '@/lib/airtable/nannies';
import { Card } from '@/components/ui';
import AdminUserActions from './AdminUserActions';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;
  if (!session?.user || !isAdmin) redirect('/login?callbackUrl=/admin');

  const { userId } = await params;
  const user = await getUserById(userId);
  if (!user) notFound();

  let host = null;
  let nanny = null;
  if (user.airtableHostId) host = await getHost(user.airtableHostId);
  if (user.airtableNannyId) nanny = await getNanny(user.airtableNannyId);

  const profile = host ?? nanny;
  const currentTier = host?.tier ?? nanny?.tier ?? nanny?.badge ?? null;
  const hasProfile = Boolean(user.airtableHostId || user.airtableNannyId);

  return (
    <div>
      <Link href="/admin/hosts" className="text-sm text-dark-green hover:underline mb-4 inline-block">
        ← Back to Hosts
      </Link>
      <Link href="/admin/caregivers" className="text-sm text-dark-green hover:underline mb-4 inline-block ml-4">
        Caregivers
      </Link>

      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        User details
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Account and profile for {user.email}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black mb-3">Account</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-dark-green/70">Email</dt>
              <dd className="text-pastel-black font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-dark-green/70">Name</dt>
              <dd className="text-pastel-black">{user.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-dark-green/70">Role</dt>
              <dd className="text-pastel-black">{user.userType ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-dark-green/70">Status</dt>
              <dd className="text-pastel-black">
                {user.locked ? (
                  <span className="text-red-600 font-medium">Locked</span>
                ) : (
                  <span className="text-dark-green">Active</span>
                )}
              </dd>
            </div>
          </dl>
        </Card>

        {profile && (
          <Card className="p-5 bg-light-green/5 border-light-green/50">
            <h2 className="font-medium text-pastel-black mb-3">
              {user.userType === 'Host' ? 'Host profile' : 'Caregiver profile'}
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-dark-green/70">Name</dt>
                <dd className="text-pastel-black">
                  {('firstName' in profile && 'lastName' in profile
                    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
                    : null) ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-dark-green/70">Tier / Badge</dt>
                <dd className="text-pastel-black">
                  {currentTier ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-dark-green/70">Location</dt>
                <dd className="text-pastel-black">
                  {(profile as { location?: string; city?: string }).location ??
                    (profile as { city?: string }).city ??
                    '—'}
                </dd>
              </div>
            </dl>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <AdminUserActions
          userId={userId}
          email={user.email}
          locked={user.locked ?? false}
          currentTier={currentTier}
          hasProfile={hasProfile}
          userType={user.userType ?? 'Host'}
        />
      </div>
    </div>
  );
}
