import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';

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
        <header className="border-b-2 border-light-green/50 bg-off-white shadow-sm">
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
        <main className="flex-1">{children}</main>
        <footer className="border-t-2 border-light-green/50 bg-off-white mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-dark-green/80">
            © Nanny Whisperer. Private network for families and nannies.
          </div>
        </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
