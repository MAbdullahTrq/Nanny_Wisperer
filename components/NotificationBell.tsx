'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const POLL_INTERVAL_MS = 60_000;

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = () => {
      fetch('/api/notifications/count')
        .then((res) => (res.ok ? res.json() : { count: 0 }))
        .then((data) => {
          if (!cancelled) setCount(data.count ?? 0);
        })
        .catch(() => {
          if (!cancelled) setCount(0);
        });
    };
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative rounded-md p-2 text-dark-green hover:bg-light-green/20 transition-colors"
      aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
