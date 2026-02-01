'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

export default function GenerateShortlistButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shortlists/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Failed to generate shortlist');
        setLoading(false);
        return;
      }
      router.push('/host/shortlists');
      router.refresh();
    } catch {
      alert('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Button
      type="button"
      variant="primary"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? 'Generating…' : 'Generate shortlist'}
    </Button>
  );
}
