import DashboardNav from '@/components/DashboardNav';

const hostNavItems = [
  { href: '/host/dashboard', label: 'Dashboard' },
  { href: '/host/shortlists', label: 'Shortlists' },
  { href: '/host/matches', label: 'Matches' },
  { href: '/host/chat', label: 'Chat' },
  { href: '/host/meetings', label: 'Meetings' },
  { href: '/host/profile', label: 'Profile' },
];

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-off-white">
      <DashboardNav brandHref="/host/dashboard" items={hostNavItems} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
