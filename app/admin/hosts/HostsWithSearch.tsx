'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui';
import type { Host } from '@/types/airtable';
import HostsTableBody from './HostsTableBody';

export type HostWithEmail = Host & { email?: string };

const HOST_SEARCH_FIELDS: (keyof HostWithEmail)[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'city',
  'country',
  'jobLocationCountry',
  'jobLocationPlace',
  'location',
  'postcode',
  'streetAndNumber',
];

function buildSearchableString(host: HostWithEmail): string {
  return HOST_SEARCH_FIELDS.map((k) => (host[k] != null ? String(host[k]) : '')).join(' ').toLowerCase();
}

function matchSearch(host: HostWithEmail, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);
  const haystack = buildSearchableString(host);
  return terms.every((term) => haystack.includes(term));
}

export default function HostsWithSearch({ hosts }: { hosts: HostWithEmail[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return hosts.filter((h) => matchSearch(h, query));
  }, [hosts, query]);

  return (
    <>
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, city, country…"
          className="w-full max-w-md rounded-lg border border-light-green/60 bg-white px-3 py-2.5 text-sm text-pastel-black placeholder:text-dark-green/50 focus:border-dark-green focus:outline-none"
          aria-label="Search hosts"
        />
        {query && (
          <p className="mt-1 text-xs text-dark-green/70">
            {filtered.length} of {hosts.length} host{hosts.length === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">
            {query ? 'No hosts match your search.' : 'No hosts yet.'}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-dark-green/20">
                <th className="py-2 pr-4 font-medium text-pastel-black">Name / Email</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Location</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Tier</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Start date</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">User</th>
              </tr>
            </thead>
            <HostsTableBody hosts={filtered} />
          </table>
        </div>
      )}
    </>
  );
}
