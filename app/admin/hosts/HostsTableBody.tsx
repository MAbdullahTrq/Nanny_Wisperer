'use client';

import { useRouter } from 'next/navigation';
import type { Host } from '@/types/airtable';

export default function HostsTableBody({ hosts }: { hosts: Host[] }) {
  const router = useRouter();

  return (
    <tbody>
      {hosts.map((h) => {
        const href = h.userId ? `/admin/users/${h.userId}` : null;
        return (
          <tr
            key={h.id}
            onClick={() => href && router.push(href)}
            className={`border-b border-light-green/30 ${href ? 'cursor-pointer hover:bg-light-green/15 transition-colors' : ''}`}
          >
            <td className="py-3 pr-4">
              <span className="font-medium text-pastel-black">{h.firstName ?? ''} {h.lastName ?? ''}</span>
            </td>
            <td className="py-3 pr-4 text-dark-green/90">{h.location ?? h.city ?? '—'}</td>
            <td className="py-3 pr-4">{h.tier ?? '—'}</td>
            <td className="py-3 pr-4">{h.desiredStartDate ?? '—'}</td>
            <td className="py-3 pr-4">
              {href ? (
                <span className="text-dark-green font-medium underline">View user</span>
              ) : (
                '—'
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
