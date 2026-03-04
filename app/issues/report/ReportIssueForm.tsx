'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface ReportIssueFormProps {
  dashboardHref: string;
}

export default function ReportIssueForm({ dashboardHref }: ReportIssueFormProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit');
        return;
      }
      setSuccess(true);
      setSubject('');
      setDescription('');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <p className="text-dark-green font-medium">Thank you. Your issue has been submitted.</p>
        <p className="text-sm text-dark-green/80 mt-1">We&apos;ll get back to you via email.</p>
        <Link href={dashboardHref} className="mt-4 inline-block text-dark-green font-medium hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-pastel-black mb-1">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={500}
          className="w-full rounded-lg border border-dark-green/30 px-3 py-2 text-pastel-black focus:outline-none focus:ring-2 focus:ring-dark-green/50"
          placeholder="Brief summary"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-pastel-black mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={5000}
          rows={5}
          className="w-full rounded-lg border border-dark-green/30 px-3 py-2 text-pastel-black focus:outline-none focus:ring-2 focus:ring-dark-green/50"
          placeholder="What happened? What did you expect?"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit'}
        </Button>
        <Link
          href={dashboardHref}
          className="inline-flex items-center rounded-lg border border-dark-green/30 px-4 py-2 text-sm font-medium text-dark-green hover:bg-light-green/20"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
