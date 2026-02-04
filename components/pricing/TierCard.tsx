import Link from 'next/link';

export interface TierCardProps {
  name: string;
  price: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  variant: 'pink' | 'green' | 'white';
  badge?: 'vip';
}

const variantStyles = {
  pink: 'bg-light-pink/40 border-light-pink',
  green: 'bg-light-green/40 border-light-green',
  white: 'bg-off-white border-dark-green/30',
};

export default function TierCard({ name, price, features, ctaLabel, ctaHref, variant, badge }: TierCardProps) {
  return (
    <div className={`rounded-2xl border-2 p-6 flex flex-col ${variantStyles[variant]}`}>
      {badge === 'vip' && (
        <div className="flex justify-end -mt-1 -mr-1" aria-hidden>
          <span className="text-2xl" title="VIP">🏅</span>
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-dark-green uppercase tracking-wide">{name}</h3>
      <p className="mt-2 text-pastel-black font-medium">Price: {price}</p>
      <ul className="mt-4 space-y-2 flex-1">
        {features.map((f, i) => (
          <li key={i} className="text-sm text-dark-green/90 flex items-start gap-2">
            <span className="text-dark-green mt-0.5">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium bg-dark-green text-off-white hover:bg-dark-green/90 transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
