export interface NetworkItem {
  tier: string;
  description: string;
}

export default function CuratedNetworkBox({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: NetworkItem[];
}) {
  return (
    <div className="rounded-2xl border-2 border-light-green bg-light-green/20 p-5">
      <h3 className="font-display text-sm font-semibold text-dark-green uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-sm text-dark-green/90 mt-1">{subtitle}</p>
      <ul className="mt-4 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-dark-green/90">
            <span className="text-dark-green mt-0.5">✓</span>
            <span><strong className="text-dark-green">{item.tier}:</strong> {item.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
