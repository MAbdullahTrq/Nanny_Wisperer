'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="font-display text-2xl font-semibold text-pastel-black mb-4">
          Invalid link
        </h1>
        <p className="text-dark-green/80 mb-6">
          This reset link is invalid or has expired. Please request a new one.
        </p>
        <Link href="/forgot-password">
          <Button variant="primary">Request new link</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="font-display text-2xl font-semibold text-pastel-black mb-4">
          Password updated
        </h1>
        <p className="text-dark-green/80 mb-6">
          You can now log in with your new password. Redirecting…
        </p>
        <Link href="/login">
          <Button variant="primary">Go to log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Set new password
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Enter your new password below.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-light-pink/50 text-dark-green text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-12 animate-pulse">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
