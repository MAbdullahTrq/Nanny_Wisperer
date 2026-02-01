import type { Metadata } from 'next';
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
        <header className="border-b border-light-green/30 bg-off-white">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <span className="font-display text-xl font-semibold text-pastel-black">
              Nanny Whisperer
            </span>
            <nav className="text-sm text-dark-green">
              <a href="/" className="hover:underline">Home</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-light-green/30 bg-off-white mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-dark-green/80">
            © Nanny Whisperer. Private network for families and nannies.
          </div>
        </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
