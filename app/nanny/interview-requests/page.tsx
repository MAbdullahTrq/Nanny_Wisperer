import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui';
import InterviewRequestsList from './InterviewRequestsList';

export default async function NannyInterviewRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/nanny/interview-requests');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">Interview requests</h1>
      <p className="text-dark-green/80 text-sm mb-6">When families request an interview, you&apos;ll see it here.</p>
      <InterviewRequestsList />
    </div>
  );
}
