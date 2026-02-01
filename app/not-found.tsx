import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--spacing-md)' }}>
        404 - Page Not Found
      </h1>
      <p style={{ color: 'var(--color-dark-green)', marginBottom: 'var(--spacing-lg)' }}>
        The page you're looking for doesn't exist or the link has expired.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: 'var(--spacing-md) var(--spacing-xl)',
          backgroundColor: 'var(--color-dark-green)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
