'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui';
import type { Host } from '@/types/airtable';
import HostsTableBody from './HostsTableBody';

export type HostWithEmail = Host & { email?: string };

type SortKey = 'name' | 'location' | 'tier' | 'startDate';
type SortDir = 'asc' | 'desc';

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

function getSortValue(host: HostWithEmail, key: SortKey): string {
  switch (key) {
    case 'name':
      return `${(host.firstName ?? '').trim()} ${(host.lastName ?? '').trim()}`.trim().toLowerCase() || (host.email ?? '').toLowerCase();
    case 'location':
      return (host.location ?? host.city ?? '').toString().toLowerCase();
    case 'tier':
      return (host.tier ?? '').toString().toLowerCase();
    case 'startDate': {
      const d = host.desiredStartDate;
      return d ?? '';
    }
    default:
      return '';
  }
}

function compareHosts(a: HostWithEmail, b: HostWithEmail, key: SortKey, dir: SortDir): number {
  const va = getSortValue(a, key);
  const vb = getSortValue(b, key);
  const cmp = va.localeCompare(vb, undefined, { numeric: key === 'startDate' });
  return dir === 'asc' ? cmp : -cmp;
}

export default function HostsWithSearch({ hosts }: { hosts: HostWithEmail[] }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const filtered = useMemo(() => {
    return hosts.filter((h) => matchSearch(h, query));
  }, [hosts, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => compareHosts(a, b, sortKey, sortDir));
    return list;
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const thClass = 'py-2 pr-4 font-medium text-pastel-black';
  const thSortableClass = `${thClass} cursor-pointer select-none hover:text-dark-green hover:underline`;

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
                <th
                  className={thSortableClass}
                  onClick={() => handleSort('name')}
                  role="columnheader"
                  aria-sort={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Name / Email {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={thSortableClass}
                  onClick={() => handleSort('location')}
                  role="columnheader"
                  aria-sort={sortKey === 'location' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Location {sortKey === 'location' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={thSortableClass}
                  onClick={() => handleSort('tier')}
                  role="columnheader"
                  aria-sort={sortKey === 'tier' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Tier {sortKey === 'tier' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={thSortableClass}
                  onClick={() => handleSort('startDate')}
                  role="columnheader"
                  aria-sort={sortKey === 'startDate' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Start date {sortKey === 'startDate' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className={thClass}>User</th>
              </tr>
            </thead>
            <HostsTableBody hosts={sorted} />
          </table>
        </div>
      )}
    </>
  );
}
