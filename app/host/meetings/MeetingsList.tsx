'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

interface Meeting {
  id: string;
  matchId: string;
  interviewRequestId: string;
  dateTime?: string;
  otherPartyName: string;
  googleMeetLink?: string;
}

export default function MeetingsList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/meetings')
      .then((res) => (res.ok ? res.json() : { meetings: [] }))
      .then((data) => {
        if (!cancelled) setMeetings(data.meetings ?? []);
      })
      .catch(() => {
        if (!cancelled) setMeetings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-dark-green/80">Loading…</p>
      </Card>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-dark-green/80">No upcoming meetings. Schedule interviews from your matches.</p>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {meetings.map((m) => (
        <li key={m.id}>
          <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium text-pastel-black">{m.otherPartyName}</p>
              <p className="text-sm text-dark-green/80 mt-1">
                {m.dateTime ? new Date(m.dateTime).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' }) : '—'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {m.googleMeetLink ? (
                <a
                  href={m.googleMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-dark-green text-off-white px-4 py-2 text-sm font-medium hover:bg-dark-green/90 transition-colors"
                >
                  Join meeting
                </a>
              ) : null}
              <Link
                href={`/host/chat`}
                className="rounded-lg border border-dark-green/30 text-dark-green px-4 py-2 text-sm font-medium hover:bg-light-green/20 transition-colors"
              >
                Chat
              </Link>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
