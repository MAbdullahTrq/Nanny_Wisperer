import Link from 'next/link';
import { Card } from '@/components/ui';

export default function ScheduleInterviewSentPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Slots sent
      </h1>
      <Card className="p-6">
        <p className="text-dark-green font-medium">The nanny will choose one of the 5 time slots.</p>
        <p className="text-sm text-dark-green/80 mt-1">
          If they select &quot;None available&quot;, you can send new slots from your matches.
        </p>
        <Link href="/host/matches" className="mt-4 inline-block text-dark-green font-medium hover:underline">
          Back to matches
        </Link>
      </Card>
    </div>
  );
}
