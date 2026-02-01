import Link from 'next/link';

export default function NannyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-off-white">
      <nav className="border-b border-light-green/30 bg-off-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/nanny/dashboard" className="font-display font-semibold text-pastel-black">
            Nanny Whisperer
          </Link>
          <div className="flex gap-4 text-sm text-dark-green">
            <Link href="/nanny/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/nanny/matches" className="hover:underline">Shortlisted</Link>
            <Link href="/nanny/interview-requests" className="hover:underline">Interview requests</Link>
            <Link href="/nanny/chat" className="hover:underline">Chat</Link>
            <Link href="/nanny/meetings" className="hover:underline">Meetings</Link>
            <Link href="/nanny/onboarding" className="hover:underline">Profile / Onboarding</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
