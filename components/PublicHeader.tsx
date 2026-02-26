'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

/**
 * Nav bar for all pages. When logged out: full public nav (Home, For Hosts, For Nannies, Pricing, Login, Sign up).
 * When logged in on public routes (e.g. /): compact nav with Dashboard + Log out so navbar is always visible.
 * When on /host/*, /nanny/*, /admin, or /matchmaker: render nothing so only that area's layout nav shows.
 */
export default function PublicHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userType = (session?.user as { userType?: string } | undefined)?.userType;
  const isAppRoute =
    pathname?.startsWith('/host') ||
    pathname?.startsWith('/nanny') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/matchmaker');

  if (status === 'authenticated' && isAppRoute) {
    return null;
  }

  if (status === 'loading') {
    return (
      <header className="border-b-2 border-dark-green/15 bg-white/90 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-dark-green">Nanny Whisperer</span>
          <span className="text-sm text-dark-green/70">Loading…</span>
        </div>
      </header>
    );
  }

  if (status === 'authenticated') {
    const dashboardHref = userType === 'Nanny' ? '/nanny/dashboard' : '/host/dashboard';
    return (
      <header className="border-b-2 border-dark-green/15 bg-white/90 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={dashboardHref}
            className="font-display text-xl font-semibold text-dark-green hover:text-pastel-black transition-colors"
          >
            Nanny Whisperer
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href={dashboardHref}
              className="text-dark-green hover:text-pastel-black font-medium transition-colors"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-dark-green hover:text-pastel-black font-medium transition-colors"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b-2 border-dark-green/15 bg-white/90 shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-dark-green hover:text-pastel-black transition-colors"
        >
          Nanny Whisperer
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-dark-green hover:text-pastel-black font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            href="/signup/host"
            className="text-dark-green hover:text-pastel-black font-medium transition-colors"
          >
            For Hosts
          </Link>
          <Link
            href="/signup/nanny"
            className="text-dark-green hover:text-pastel-black font-medium transition-colors"
          >
            For Nannies
          </Link>
          <Link
            href="/pricing"
            className="text-dark-green hover:text-pastel-black font-medium transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-dark-green hover:text-pastel-black font-medium transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-dark-green text-off-white hover:bg-dark-green/90 transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
