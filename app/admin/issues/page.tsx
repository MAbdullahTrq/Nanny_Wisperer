import { Card } from '@/components/ui';

export default function AdminIssuesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Reported issues
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        User-reported issues. Add a table and workflow when ready.
      </p>

      <Card className="p-6">
        <p className="text-dark-green/80 text-sm">
          No reported issues table yet. When you add an Airtable table or external system for reported issues, list them here.
        </p>
      </Card>
    </div>
  );
}
