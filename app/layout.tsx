import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'Nanny Whisperer',
  description: 'Private childcare matchmaking network',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <SessionProvider>
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t-2 border-light-green/50 bg-off-white mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center gap-3 text-center text-sm text-dark-green/80">
            <Link href="/" className="flex items-center">
              <Image src="/logos/horizontal-green.svg" alt="Nanny Whisperer" width={160} height={36} className="h-7 w-auto" />
            </Link>
            <p>© Nanny Whisperer. Private network for families and nannies.</p>
          </div>
        </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
