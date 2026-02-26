import type { Metadata } from 'next';
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
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-dark-green/80">
            © Nanny Whisperer. Private network for families and nannies.
          </div>
        </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
