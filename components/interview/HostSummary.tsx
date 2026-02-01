/**
 * Host summary for interview page. Stub for T1; full implementation in T8.
 */

export default function HostSummary({ host }: { host: unknown }) {
  return (
    <div className="rounded-lg border border-light-green/40 bg-off-white p-4">
      <h3 className="font-medium text-pastel-black">Host family</h3>
      <p className="mt-2 text-sm text-dark-green/80">{host ? 'Host details' : 'No host data'}</p>
    </div>
  );
}
