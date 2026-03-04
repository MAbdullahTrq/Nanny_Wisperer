import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui';
import MeetingsList from './MeetingsList';

export default async function HostMeetingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/host/meetings');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">Meetings</h1>
      <p className="text-dark-green/80 text-sm mb-6">Upcoming interviews and meetings.</p>
      <MeetingsList />
    </div>
  );
}
