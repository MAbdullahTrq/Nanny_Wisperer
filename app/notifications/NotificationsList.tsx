'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

interface Notification {
  id: string;
  createdTime: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
}

interface NotificationsListProps {
  dashboardHref: string;
}

export default function NotificationsList({ dashboardHref }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    if (res.ok) fetchNotifications();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-dark-green/80">Loading…</p>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-dark-green/80">No notifications.</p>
        <Link href={dashboardHref} className="mt-3 inline-block text-dark-green font-medium hover:underline">
          Back to dashboard
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <Card key={n.id} className={`p-4 ${n.read ? 'opacity-75' : ''}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-pastel-black">{n.title}</p>
              {n.message ? (
                <p className="text-sm text-dark-green/80 mt-1">{n.message}</p>
              ) : null}
              <p className="text-xs text-dark-green/60 mt-2">
                {new Date(n.createdTime).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {n.link ? (
                <Link
                  href={n.link}
                  className="rounded-lg bg-dark-green text-off-white px-3 py-1.5 text-sm font-medium hover:bg-dark-green/90"
                >
                  View
                </Link>
              ) : null}
              {!n.read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="rounded-lg border border-dark-green/30 px-3 py-1.5 text-sm text-dark-green hover:bg-light-green/20"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        </Card>
      ))}
      <p className="mt-4 text-center text-sm text-dark-green/60">
        <Link href={dashboardHref} className="hover:underline">Back to dashboard</Link>
      </p>
    </div>
  );
}
