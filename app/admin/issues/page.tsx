import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui';
import IssuesList from './IssuesList';

export default async function AdminIssuesPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;
  if (!session?.user || !isAdmin) redirect('/login?callbackUrl=/admin/issues');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Reported issues
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        User-reported issues. Filter by status and update status as you resolve them.
      </p>
      <IssuesList />
    </div>
  );
}
