'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';

type Status = 'Open' | 'In Progress' | 'Resolved';

interface Issue {
  id: string;
  createdTime: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  status: Status;
}

export default function IssuesList() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchIssues = () => {
    const url = statusFilter
      ? `/api/admin/issues?status=${encodeURIComponent(statusFilter)}`
      : '/api/admin/issues';
    fetch(url)
      .then((res) => (res.ok ? res.json() : { issues: [] }))
      .then((data) => setIssues(data.issues ?? []))
      .catch(() => setIssues([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchIssues();
  }, [statusFilter]);

  const updateStatus = async (id: string, status: Status) => {
    const res = await fetch(`/api/admin/issues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchIssues();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-dark-green/80">Loading…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-pastel-black">Filter:</span>
        {(['', 'Open', 'In Progress', 'Resolved'] as const).map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-dark-green text-off-white'
                : 'bg-light-green/30 text-dark-green hover:bg-light-green/50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {issues.length === 0 ? (
        <Card className="p-6">
          <p className="text-dark-green/80">No reported issues.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-pastel-black">{issue.subject}</p>
                    <p className="text-sm text-dark-green/80 mt-1">
                      {issue.userEmail} · {new Date(issue.createdTime).toLocaleString()}
                    </p>
                    <p className="text-sm text-dark-green mt-2 whitespace-pre-wrap">{issue.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        issue.status === 'Resolved'
                          ? 'bg-green-100 text-green-800'
                          : issue.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {issue.status}
                    </span>
                    {issue.status !== 'Resolved' && (
                      <select
                        value={issue.status}
                        onChange={(e) => updateStatus(issue.id, e.target.value as Status)}
                        className="rounded border border-dark-green/30 px-2 py-1 text-sm"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
