import { Card } from '@/components/ui';

export default function NannyMeetingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">Meetings</h1>
      <p className="text-dark-green/80 text-sm mb-6">Upcoming interviews and meetings.</p>
      <Card className="p-6">
        <p className="text-dark-green/80">No upcoming meetings.</p>
      </Card>
    </div>
  );
}
