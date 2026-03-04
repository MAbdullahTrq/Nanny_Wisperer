'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

interface InterviewRequestItem {
  id: string;
  matchId: string;
  hostName: string;
  hostSummary?: string;
  slots: string[];
  status: string;
  selectSlotUrl?: string;
  googleMeetLink?: string;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending_slots':
      return 'Pick a slot';
    case 'nanny_selected':
      return 'Waiting for meeting';
    case 'meeting_created':
      return 'Meeting scheduled';
    case 'none_available':
      return 'No slot available';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export default function InterviewRequestsList() {
  const [requests, setRequests] = useState<InterviewRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/nanny/interview-requests')
      .then((res) => (res.ok ? res.json() : { interviewRequests: [] }))
      .then((data) => {
        if (!cancelled) setRequests(data.interviewRequests ?? []);
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
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

  if (requests.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-dark-green/80">No interview requests yet.</p>
      </Card>
    );
  }

  return (
    <ul className="space-y-4">
      {requests.map((r) => (
        <li key={r.id}>
          <Card className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium text-pastel-black">{r.hostName}</p>
                {r.hostSummary ? (
                  <p className="text-sm text-dark-green/80 mt-1">{r.hostSummary}</p>
                ) : null}
                <p className="text-sm text-dark-green/70 mt-2">
                  <span className="font-medium">Status:</span> {statusLabel(r.status)}
                </p>
                {r.slots.length > 0 ? (
                  <ul className="mt-2 text-sm text-dark-green/80 list-disc list-inside">
                    {r.slots.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                {r.status === 'meeting_created' && r.googleMeetLink ? (
                  <a
                    href={r.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-dark-green text-off-white px-4 py-2 text-sm font-medium hover:bg-dark-green/90 transition-colors text-center"
                  >
                    View meeting
                  </a>
                ) : r.selectSlotUrl ? (
                  <a
                    href={r.selectSlotUrl}
                    className="rounded-lg bg-dark-green text-off-white px-4 py-2 text-sm font-medium hover:bg-dark-green/90 transition-colors text-center"
                  >
                    Select slot
                  </a>
                ) : null}
                <Link
                  href="/nanny/chat"
                  className="rounded-lg border border-dark-green/30 text-dark-green px-4 py-2 text-sm font-medium hover:bg-light-green/20 transition-colors text-center"
                >
                  Chat
                </Link>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
