import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui';
import ReportIssueForm from './ReportIssueForm';

export default async function ReportIssuePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/issues/report');

  const userType = (session.user as { userType?: string }).userType;
  const dashboardHref = userType === 'Nanny' ? '/nanny/dashboard' : '/host/dashboard';

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">Report an issue</h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Describe the problem and we&apos;ll look into it.
      </p>
      <Card className="p-6">
        <ReportIssueForm dashboardHref={dashboardHref} />
      </Card>
    </div>
  );
}
