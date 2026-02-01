'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = (searchParams.get('callbackUrl') as string) || '/auth/redirect';
  const error = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter email and password.');
      return;
    }
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: true,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) setFormError('Invalid email or password.');
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        Log in
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">
        Log in to your Nanny Whisperer account.
      </p>

      {(error || formError) && (
        <div className="mb-4 p-3 rounded-lg bg-light-pink/50 text-dark-green text-sm">
          {error === 'CredentialsSignin' ? 'Invalid email or password.' : formError || error}
        </div>
      )}

      <form onSubmit={handleCredentials} className="space-y-4 mb-6">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in with email'}
        </Button>
      </form>

      <div className="relative my-6">
        <span className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-light-green/50" />
        </span>
        <span className="relative flex justify-center text-sm text-dark-green/70 bg-off-white px-2">
          or
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => signIn('google', { callbackUrl })}
      >
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-dark-green/80">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-dark-green font-medium hover:underline">
          Sign up
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-dark-green/80">
        <Link href="/forgot-password" className="text-dark-green font-medium hover:underline">
          Forgot password?
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-12 animate-pulse">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
