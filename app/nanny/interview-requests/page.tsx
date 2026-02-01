import { Card } from '@/components/ui';

export default function NannyInterviewRequestsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">Interview requests</h1>
      <p className="text-dark-green/80 text-sm mb-6">When families request an interview, you&apos;ll see it here.</p>
      <Card className="p-6">
        <p className="text-dark-green/80">No interview requests yet.</p>
      </Card>
    </div>
  );
}
