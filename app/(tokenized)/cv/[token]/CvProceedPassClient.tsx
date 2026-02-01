'use client';

import { useState } from 'react';
import ProceedPass from '@/components/cv/ProceedPass';

interface CvProceedPassClientProps {
  token: string;
  matchId: string;
  currentStatus?: { hostProceed?: boolean; nannyProceed?: boolean };
}

export default function CvProceedPassClient({
  token,
  matchId,
  currentStatus,
}: CvProceedPassClientProps) {
  const [status, setStatus] = useState(currentStatus);

  const handleAction = async (proceed: boolean) => {
    const res = await fetch('/api/matches/proceed-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        choice: proceed ? 'proceed' : 'pass',
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Failed to update');
    }
    const data = await res.json();
    setStatus({
      hostProceed: data.hostProceed ?? status?.hostProceed,
      nannyProceed: data.nannyProceed ?? status?.nannyProceed,
    });
  };

  return (
    <ProceedPass
      matchId={matchId}
      isHost={true}
      currentStatus={status}
      onAction={handleAction}
    />
  );
}
