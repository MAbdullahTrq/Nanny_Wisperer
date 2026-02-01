'use client';

/**
 * Chat client for tokenized chat page. Stub for T1; full implementation in T7.
 */

export default function ChatClient({ token, roomId }: { token: string; roomId: string }) {
  return (
    <div className="rounded-lg border border-light-green/40 bg-off-white p-4">
      <p className="text-sm text-dark-green/80">
        Chat room: {roomId}. Token present. Full chat UI in T7.
      </p>
    </div>
  );
}
