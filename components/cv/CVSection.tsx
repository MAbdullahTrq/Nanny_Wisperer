'use client';

interface CVSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function CVSection({ title, children }: CVSectionProps) {
  return (
    <section style={{ marginBottom: 'var(--spacing-xl)' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-dark-green)',
          borderBottom: '2px solid var(--color-light-green)',
          paddingBottom: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        {title}
      </h2>
      <div style={{ color: 'var(--color-pastel-black)', lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  );
}
