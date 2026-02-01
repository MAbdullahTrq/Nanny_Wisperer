'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';

function toISO(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m ?? 0, 0, 0);
  return d.toISOString();
}

export default function ScheduleInterviewForm({
  matchId,
  durationMinutes,
}: {
  matchId: string;
  durationMinutes: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState<Array<{ date: string; time: string }>>([
    { date: '', time: '' },
    { date: '', time: '' },
    { date: '', time: '' },
    { date: '', time: '' },
    { date: '', time: '' },
  ]);

  const updateSlot = (i: number, field: 'date' | 'time', value: string) => {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const allFilled = slots.every((s) => s.date && s.time);
    if (!allFilled) {
      setError('Please fill all 5 date and time fields.');
      return;
    }
    const slotStrings = slots.map((s) => toISO(new Date(s.date), s.time));
    setLoading(true);
    try {
      const res = await fetch('/api/interview-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          slot1: slotStrings[0],
          slot2: slotStrings[1],
          slot3: slotStrings[2],
          slot4: slotStrings[3],
          slot5: slotStrings[4],
          isVip: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create interview request');
        setLoading(false);
        return;
      }
      router.push('/host/schedule-interview/sent');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {slots.map((slot, i) => (
          <div key={i} className="flex flex-wrap gap-3 items-end">
            <label className="sr-only">Slot {i + 1}</label>
            <input
              type="date"
              value={slot.date}
              onChange={(e) => updateSlot(i, 'date', e.target.value)}
              min={minDate}
              className="rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              required
            />
            <input
              type="time"
              value={slot.time}
              onChange={(e) => updateSlot(i, 'time', e.target.value)}
              className="rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black"
              required
            />
            <span className="text-sm text-dark-green/80">{durationMinutes} min</span>
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send slots to nanny'}
          </Button>
          <Link href="/host/matches">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
