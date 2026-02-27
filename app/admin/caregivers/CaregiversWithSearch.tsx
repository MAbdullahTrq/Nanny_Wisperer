'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import type { Nanny } from '@/types/airtable';

export type NannyWithEmail = Nanny & { email?: string };

const NANNY_SEARCH_FIELDS: (keyof NannyWithEmail)[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'city',
  'country',
  'currentLocation',
  'nationality',
  'postcode',
  'streetAndNumber',
  'languageSkills',
];

function buildSearchableString(nanny: NannyWithEmail): string {
  const parts = NANNY_SEARCH_FIELDS.map((k) => {
    const v = nanny[k];
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) return Object.values(v).join(' ');
    return String(v);
  });
  return parts.join(' ').toLowerCase();
}

function matchSearch(nanny: NannyWithEmail, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);
  const haystack = buildSearchableString(nanny);
  return terms.every((term) => haystack.includes(term));
}

type NannyTypeFilter = '' | 'Nanny' | 'Au Pair';

export default function CaregiversWithSearch({
  caregivers,
  initialNannyType,
}: {
  caregivers: NannyWithEmail[];
  initialNannyType?: string;
}) {
  const [query, setQuery] = useState('');
  const [nannyType, setNannyType] = useState<NannyTypeFilter>(
    initialNannyType === 'Au Pair' ? 'Au Pair' : initialNannyType === 'Nanny' ? 'Nanny' : ''
  );

  const filtered = useMemo(() => {
    let list = caregivers;
    if (nannyType === 'Au Pair') list = list.filter((c) => c.nannyType === 'Au Pair');
    else if (nannyType === 'Nanny') list = list.filter((c) => (c.nannyType ?? 'Nanny') === 'Nanny');
    return list.filter((c) => matchSearch(c, query));
  }, [caregivers, nannyType, query]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, nationality, country, location…"
          className="flex-1 max-w-md rounded-lg border border-light-green/60 bg-white px-3 py-2.5 text-sm text-pastel-black placeholder:text-dark-green/50 focus:border-dark-green focus:outline-none"
          aria-label="Search caregivers"
        />
        <div className="flex gap-2">
          {(['', 'Nanny', 'Au Pair'] as const).map((type) => (
            <button
              key={type || 'all'}
              type="button"
              onClick={() => setNannyType(type)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                nannyType === type ? 'bg-dark-green text-off-white' : 'bg-light-green/40 text-dark-green hover:bg-light-green/60'
              }`}
            >
              {type || 'All'}
            </button>
          ))}
        </div>
      </div>
      {query && (
        <p className="text-xs text-dark-green/70 mb-2">
          {filtered.length} of {caregivers.length} caregiver{caregivers.length === 1 ? '' : 's'}
        </p>
      )}

      {filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">
            {query || nannyType ? 'No caregivers match your search or filter.' : 'No caregivers match the filter.'}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-dark-green/20">
                <th className="py-2 pr-4 font-medium text-pastel-black">Name</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Type</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Badge / Tier</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">Location</th>
                <th className="py-2 pr-4 font-medium text-pastel-black">User</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-light-green/30">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-pastel-black">
                      {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{(c.nannyType as string) ?? 'Nanny'}</td>
                  <td className="py-3 pr-4">{c.badge ?? c.tier ?? '—'}</td>
                  <td className="py-3 pr-4">{c.currentLocation ?? c.city ?? '—'}</td>
                  <td className="py-3 pr-4">
                    {c.userId ? (
                      <Link href={`/admin/users/${c.userId}`} className="text-dark-green font-medium hover:underline">
                        View user
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
