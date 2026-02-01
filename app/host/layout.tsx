import Link from 'next/link';

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-off-white">
      <nav className="border-b border-light-green/30 bg-off-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/host/dashboard" className="font-display font-semibold text-pastel-black">
            Nanny Whisperer
          </Link>
          <div className="flex gap-4 text-sm text-dark-green">
            <Link href="/host/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/host/shortlists" className="hover:underline">Shortlists</Link>
            <Link href="/host/matches" className="hover:underline">Matches</Link>
            <Link href="/host/chat" className="hover:underline">Chat</Link>
            <Link href="/host/meetings" className="hover:underline">Meetings</Link>
            <Link href="/host/onboarding" className="hover:underline">Profile / Onboarding</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
