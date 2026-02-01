'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
          Check your email
        </h1>
        <p className="text-dark-green/80 text-sm mb-6">
          If an account exists with this email, you will receive a reset link. Please check your inbox and spam folder.
        </p>
        <Link href="/login">
          <Button variant="primary">Back to log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Forgot password?
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-light-pink/50 text-dark-green text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-green/80">
        <Link href="/login" className="text-dark-green font-medium hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
