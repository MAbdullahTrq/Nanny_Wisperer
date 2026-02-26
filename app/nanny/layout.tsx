import DashboardNav from '@/components/DashboardNav';

const nannyNavItems = [
  { href: '/nanny/dashboard', label: 'Dashboard' },
  { href: '/nanny/matches', label: 'Shortlisted' },
  { href: '/nanny/interview-requests', label: 'Interview requests' },
  { href: '/nanny/chat', label: 'Chat' },
  { href: '/nanny/meetings', label: 'Meetings' },
  { href: '/nanny/profile', label: 'Profile' },
];

export default function NannyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-off-white">
      <DashboardNav brandHref="/nanny/dashboard" items={nannyNavItems} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
