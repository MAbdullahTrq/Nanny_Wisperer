'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';

const HOST_TIERS = ['Standard', 'Fast Track', 'VIP'] as const;
const NANNY_TIERS = ['Basic', 'Verified', 'Certified'] as const;

type Props = {
  userId: string;
  email: string;
  locked: boolean;
  currentTier: string | null;
  hasProfile: boolean;
  userType: string;
};

export default function AdminUserActions({
  userId,
  email,
  locked,
  currentTier,
  hasProfile,
  userType,
}: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState(currentTier ?? '');
  const [loading, setLoading] = useState<'password' | 'lock' | 'tier' | 'impersonate' | null>(null);

  const tierOptions = useMemo(() => {
    const list: string[] = userType === 'Host' ? [...HOST_TIERS] : [...NANNY_TIERS];
    if (currentTier && !list.includes(currentTier)) {
      list.unshift(currentTier);
    }
    return list;
  }, [userType, currentTier]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading('password');
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update password.');
        return;
      }
      setMessage('Password updated.');
      setPassword('');
    } catch {
      setError('Request failed.');
    }
    setLoading(null);
  }

  async function handleLockToggle() {
    setError('');
    setMessage('');
    setLoading('lock');
    try {
      const res = await fetch(`/api/admin/users/${userId}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !locked }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update lock status.');
        return;
      }
      setMessage(locked ? 'Account unlocked.' : 'Account locked.');
      router.refresh();
    } catch {
      setError('Request failed.');
    }
    setLoading(null);
  }

  async function handleTierSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasProfile) return;
    setError('');
    setMessage('');
    setLoading('tier');
    try {
      const res = await fetch(`/api/admin/users/${userId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update tier.');
        return;
      }
      setMessage('Subscription/tier updated.');
      router.refresh();
    } catch {
      setError('Request failed.');
    }
    setLoading(null);
  }

  async function handleImpersonate() {
    setError('');
    setMessage('');
    setLoading('impersonate');
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create login link.');
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Request failed.');
    }
    setLoading(null);
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 rounded-lg bg-light-green/30 text-dark-green text-sm">{message}</div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-light-pink/50 text-dark-green text-sm">{error}</div>
      )}

      <Card className="p-5 bg-light-green/5 border-light-green/50">
        <h2 className="font-medium text-pastel-black mb-3">Reset password</h2>
        <form onSubmit={handleResetPassword} className="flex flex-wrap items-end gap-2">
          <Input
            type="password"
            placeholder="New password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-w-[200px]"
            minLength={8}
          />
          <Button type="submit" variant="primary" disabled={loading !== null}>
            {loading === 'password' ? 'Updating…' : 'Set password'}
          </Button>
        </form>
      </Card>

      <Card className="p-5 bg-light-green/5 border-light-green/50">
        <h2 className="font-medium text-pastel-black mb-3">Account lock</h2>
        <p className="text-sm text-dark-green/80 mb-2">
          {locked ? 'Account is locked; user cannot log in.' : 'Account is active.'}
        </p>
        <Button
          type="button"
          variant={locked ? 'secondary' : 'primary'}
          onClick={handleLockToggle}
          disabled={loading !== null}
        >
          {loading === 'lock' ? 'Updating…' : locked ? 'Unlock account' : 'Lock account'}
        </Button>
      </Card>

      {hasProfile && (
        <Card className="p-5 bg-light-green/5 border-light-green/50">
          <h2 className="font-medium text-pastel-black mb-3">Subscription / tier</h2>
          <p className="text-sm text-dark-green/80 mb-2">
            {userType === 'Host'
              ? 'Host tier (e.g. Standard, VIP).'
              : 'Caregiver badge/tier (e.g. Basic, Verified, Certified).'}
          </p>
          <form onSubmit={handleTierSubmit} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[180px]">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full rounded-lg border border-light-green/60 bg-off-white px-3 py-2.5 text-pastel-black focus:border-dark-green focus:outline-none"
              >
                <option value="">—</option>
                {tierOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" disabled={loading !== null}>
              {loading === 'tier' ? 'Updating…' : 'Update tier'}
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-5 border-light-pink/40 bg-light-pink/10">
        <h2 className="font-medium text-pastel-black mb-3">Log in as this user</h2>
        <p className="text-sm text-dark-green/80 mb-2">
          Open a new session as this user (you will be redirected to their dashboard).
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={handleImpersonate}
          disabled={loading !== null || locked}
        >
          {loading === 'impersonate' ? 'Redirecting…' : 'Log in as user'}
        </Button>
        {locked && (
          <p className="text-xs text-dark-green/70 mt-2">Unlock the account first to impersonate.</p>
        )}
      </Card>
    </div>
  );
}
