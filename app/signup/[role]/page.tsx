'use client';

import { useParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { validateEmail, validatePassword } from '@/lib/auth/password';

const ROLES = { host: 'Host', nanny: 'Nanny' } as const;
type RoleKey = keyof typeof ROLES;

export default function SignupRolePage() {
  const params = useParams();
  const role = (params.role as string)?.toLowerCase();
  const roleType = (role === 'nanny' ? 'Nanny' : 'Host') as 'Host' | 'Nanny';
  const isNanny = role === 'nanny';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      setError(pwCheck.error);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: [firstName, lastName].filter(Boolean).join(' ') || email,
          password,
          userType: roleType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign up failed.');
        setLoading(false);
        return;
      }
      await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: '/auth/redirect',
      });
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  if (role !== 'host' && role !== 'nanny') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-dark-green/80">Invalid signup type.</p>
        <Link href="/signup" className="mt-4 inline-block text-dark-green font-medium hover:underline">
          Back to sign up
        </Link>
      </div>
    );
  }

  const title = isNanny ? 'I am a Nanny / Au Pair' : 'We are a host family';
  const subtitle = isNanny
    ? 'Create your account to get matched with families.'
    : 'Create your account to receive curated nanny shortlists.';

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-2">
        {title}
      </h1>
      <p className="text-dark-green/80 text-sm mb-6">{subtitle}</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-light-pink/50 text-dark-green text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
          <Input
            label="Last name"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
          />
        </div>
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
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up with email'}
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
        onClick={() =>
          signIn('google', {
            callbackUrl: `/signup/complete?role=${roleType}`,
          })
        }
      >
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-dark-green/80">
        Already have an account?{' '}
        <Link href="/login" className="text-dark-green font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
