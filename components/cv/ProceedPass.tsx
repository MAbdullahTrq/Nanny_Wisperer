'use client';

import { useState } from 'react';

interface ProceedPassProps {
  matchId: string;
  isHost: boolean;
  currentStatus?: { hostProceed?: boolean; nannyProceed?: boolean };
  onAction: (proceed: boolean) => Promise<void>;
}

export default function ProceedPass({ matchId, isHost, currentStatus, onAction }: ProceedPassProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'proceed' | 'pass' | null>(null);

  const hasProceeded = isHost ? currentStatus?.hostProceed : currentStatus?.nannyProceed;
  const bothProceeded = currentStatus?.hostProceed && currentStatus?.nannyProceed;

  const handleClick = async (proceed: boolean) => {
    if (loading || hasProceeded) return;

    setLoading(true);
    setAction(proceed ? 'proceed' : 'pass');

    try {
      await onAction(proceed);
    } catch (error) {
      console.error('Error updating proceed/pass:', error);
      alert('Failed to update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (bothProceeded) {
    return (
      <div
        style={{
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-light-green)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          color: 'var(--color-dark-green)',
          fontWeight: 600,
        }}
      >
        ✓ Both parties have proceeded. Next steps will be communicated shortly.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        justifyContent: 'center',
        padding: 'var(--spacing-xl) 0',
      }}
    >
      <button
        onClick={() => handleClick(true)}
        disabled={loading || hasProceeded}
        style={{
          padding: 'var(--spacing-md) var(--spacing-xl)',
          backgroundColor: hasProceeded
            ? 'var(--color-light-green)'
            : 'var(--color-dark-green)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: loading || hasProceeded ? 'not-allowed' : 'pointer',
          opacity: loading && action !== 'proceed' ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {loading && action === 'proceed' ? 'Processing...' : hasProceeded ? '✓ Proceeded' : 'Proceed'}
      </button>
      <button
        onClick={() => handleClick(false)}
        disabled={loading || hasProceeded}
        style={{
          padding: 'var(--spacing-md) var(--spacing-xl)',
          backgroundColor: 'transparent',
          color: 'var(--color-pastel-black)',
          border: '2px solid var(--color-light-pink)',
          borderRadius: 'var(--radius-md)',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: loading || hasProceeded ? 'not-allowed' : 'pointer',
          opacity: loading && action !== 'pass' ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {loading && action === 'pass' ? 'Processing...' : 'Pass'}
      </button>
    </div>
  );
}
