import { getServerSession } from 'next-auth';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function MatchmakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isMatchmaker = (session?.user as { isMatchmaker?: boolean } | undefined)?.isMatchmaker;
  if (!session?.user || !isMatchmaker) redirect('/login?callbackUrl=/matchmaker');

  const userType = (session.user as { userType?: string }).userType;
  const backToAppHref =
    userType === 'Host'
      ? '/host/dashboard'
      : userType === 'Nanny'
        ? '/nanny/dashboard'
        : '/';

  return (
    <div className="min-h-screen bg-off-white">
      <nav className="border-b border-dark-green/20 bg-white/90">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/matchmaker" className="flex items-center gap-3">
            <Image src="/logos/horizontal-green.svg" alt="Nanny Whisperer" width={180} height={40} className="h-8 w-auto" />
            <span className="font-display font-semibold text-dark-green hidden sm:inline">Matching Control Panel</span>
          </Link>
          <div className="flex gap-4 text-sm text-dark-green">
            <Link href="/matchmaker" className="hover:underline">Queue</Link>
            <Link href="/matchmaker/sent" className="hover:underline">Sent log</Link>
            <Link href="/matchmaker/interviews" className="hover:underline">Interviews</Link>
          </div>
          <Link href={backToAppHref} className="text-sm text-dark-green/80 hover:underline">Back to app</Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
