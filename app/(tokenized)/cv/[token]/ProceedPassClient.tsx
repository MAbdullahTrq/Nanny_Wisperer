'use client';

import { useState } from 'react';
import ProceedPass from '@/components/cv/ProceedPass';
import { ghlClient } from '@/lib/ghl/client';

interface ProceedPassClientProps {
  matchId: string;
  hostId: string;
  currentStatus?: { hostProceed?: boolean; nannyProceed?: boolean };
  token: string;
}

export default function ProceedPassClient({
  matchId,
  hostId,
  currentStatus,
  token,
}: ProceedPassClientProps) {
  const handleAction = async (proceed: boolean) => {
    // Call GHL API to update Proceed/Pass status
    // This will trigger the webhook that updates Airtable
    try {
      // Note: This endpoint may need to be adjusted based on GHL API
      // For now, we'll call a custom endpoint or update via GHL API directly
      await fetch('/api/ghl/update-proceed-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          contactId: hostId,
          proceed,
          isHost: true,
        }),
      });
    } catch (error) {
      console.error('Error updating proceed/pass:', error);
      throw error;
    }
  };

  return (
    <ProceedPass
      matchId={matchId}
      isHost={true}
      currentStatus={currentStatus}
      onAction={handleAction}
    />
  );
}
