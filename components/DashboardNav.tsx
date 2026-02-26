'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export type NavItem = { href: string; label: string };

export default function DashboardNav({
  brandHref,
  items,
}: {
  brandHref: string;
  items: NavItem[];
}) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-light-green/30 bg-off-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href={brandHref}
          className="font-display font-semibold text-pastel-black"
        >
          Nanny Whisperer
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {items.map(({ href, label }) => {
            const isActive =
              pathname === href || (href !== brandHref && pathname.startsWith(href + '/'));
            return (
              <Link
                key={href}
                href={href}
                className={`
                  rounded-md px-3 py-2 font-medium transition-colors
                  ${isActive
                    ? 'bg-light-green/30 text-dark-green'
                    : 'text-dark-green hover:bg-light-green/20 hover:text-dark-green'
                  }
                `}
              >
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="rounded-md px-3 py-2 font-medium text-dark-green hover:bg-light-pink/30 hover:text-pastel-black transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
