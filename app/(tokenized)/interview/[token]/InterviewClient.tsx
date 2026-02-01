'use client';

/**
 * Interview slot selection client. T8.3 — nanny picks one slot or "None available".
 */

import { useState } from 'react';
import SlotPicker from '@/components/interview/SlotPicker';
import type { InterviewRequestStatus } from '@/types/airtable';

export default function InterviewClient({
  interviewRequestId,
  token,
  slotLabels,
  originalIndices,
  status,
  noSlotsMessage,
}: {
  interviewRequestId: string;
  token: string;
  slotLabels: string[];
  originalIndices: number[];
  status: InterviewRequestStatus;
  noSlotsMessage?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'nanny_selected' | 'none_available' | null>(null);
  const [error, setError] = useState('');

  const handleSelect = async (displayIndex: number) => {
    const selectedSlotIndex = originalIndices[displayIndex] ?? displayIndex;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/interview-requests/${interviewRequestId}/select-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, selectedSlotIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setResult('nanny_selected');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNoneAvailable = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/interview-requests/${interviewRequestId}/select-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, noneAvailable: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setResult('none_available');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'pending_slots') {
    return (
      <div className="mt-6 rounded-lg border border-light-green/40 bg-off-white p-4 text-sm text-dark-green/80">
        {status === 'nanny_selected' && <p>Meeting will be scheduled shortly.</p>}
        {status === 'none_available' && <p>Host will send new slots.</p>}
        {status === 'meeting_created' && <p>Your meeting has been scheduled.</p>}
        {!['nanny_selected', 'none_available', 'meeting_created'].includes(status) && (
          <p>This request has already been handled.</p>
        )}
      </div>
    );
  }

  if (result === 'nanny_selected') {
    return (
      <div className="mt-6 rounded-lg border border-light-green/40 bg-off-white p-4 text-sm text-dark-green/80">
        <p>Meeting will be scheduled shortly.</p>
      </div>
    );
  }

  if (result === 'none_available') {
    return (
      <div className="mt-6 rounded-lg border border-light-green/40 bg-off-white p-4 text-sm text-dark-green/80">
        <p>Host will send new slots.</p>
      </div>
    );
  }

  if (slotLabels.length === 0 && noSlotsMessage) {
    return (
      <div className="mt-6 rounded-lg border border-light-green/40 bg-off-white p-4 text-sm text-dark-green/80">
        <p>{noSlotsMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <SlotPicker
        slotLabels={slotLabels}
        onSelect={handleSelect}
        onNoneAvailable={handleNoneAvailable}
        disabled={loading}
      />
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
