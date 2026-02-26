'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';

type Suggested = { nannyId: string; name: string; nannyType: string; score: number };

export default function MatchmakerQueueClient({
  hostId,
  hostName,
  suggested,
}: {
  hostId: string;
  hostName: string;
  suggested: Suggested[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [matchSource, setMatchSource] = useState<'admin_curated' | 'premium_concierge'>('admin_curated');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (nannyId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(nannyId)) next.delete(nannyId);
      else next.add(nannyId);
      return next;
    });
    setError('');
  };

  const sendToHost = async () => {
    if (selected.size === 0) {
      setError('Select at least one caregiver.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const matches = suggested.filter((s) => selected.has(s.nannyId)).map((s) => ({ nannyId: s.nannyId, score: s.score }));
      const res = await fetch('/api/matchmaker/send-to-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId,
          matches,
          matchSource,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to send to host');
        setLoading(false);
        return;
      }
      router.refresh();
      setSelected(new Set());
    } catch {
      setError('Something went wrong.');
    }
    setLoading(false);
  };

  if (suggested.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-dark-green/80">No suggested matches above threshold for this host.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-dark-green">
          <span>Match type:</span>
          <select
            value={matchSource}
            onChange={(e) => setMatchSource(e.target.value as 'admin_curated' | 'premium_concierge')}
            className="rounded border border-light-green/60 bg-off-white px-2 py-1"
          >
            <option value="admin_curated">Admin curated</option>
            <option value="premium_concierge">Premium concierge</option>
          </select>
        </label>
        <Button
          type="button"
          variant="primary"
          onClick={sendToHost}
          disabled={loading || selected.size === 0}
        >
          {loading ? 'Sending…' : `Send to host (${selected.size} selected)`}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="space-y-2">
        {suggested.map((s) => (
          <li key={s.nannyId}>
            <Card className="p-4 flex items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(s.nannyId)}
                  onChange={() => toggle(s.nannyId)}
                />
                <span className="font-medium text-pastel-black">{s.name}</span>
                <span className="text-sm text-dark-green/80">{s.nannyType}</span>
                <span className="text-sm text-dark-green">Score: {s.score}%</span>
              </label>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
