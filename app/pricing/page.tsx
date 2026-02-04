import Link from 'next/link';

export const metadata = {
  title: 'Pricing | Nanny Whisperer',
  description: 'Membership tiers for families and nannies',
};

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-semibold text-dark-green text-center mb-4">
        Membership Tiers
      </h1>
      <p className="text-dark-green/90 text-center mb-12">
        Choose your path. Curated matching included in all tiers — upgrade for speed and concierge support.
      </p>
      <div className="grid sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <Link
          href="/pricing/host"
          className="rounded-2xl border-2 border-light-green bg-light-green/20 p-8 text-center hover:bg-light-green/30 transition-colors"
        >
          <h2 className="font-display text-xl font-semibold text-dark-green mb-2">For Families</h2>
          <p className="text-dark-green/90 text-sm mb-4">
            Find your nanny through curated shortlists, interviews, and contracts at your pace.
          </p>
          <span className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-dark-green text-off-white">
            View host pricing
          </span>
        </Link>
        <Link
          href="/pricing/nanny"
          className="rounded-2xl border-2 border-light-pink bg-light-pink/20 p-8 text-center hover:bg-light-pink/30 transition-colors"
        >
          <h2 className="font-display text-xl font-semibold text-dark-green mb-2">For Nannies</h2>
          <p className="text-dark-green/90 text-sm mb-4">
            Find your next family through the private network. Get shortlisted and land the right role.
          </p>
          <span className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-dark-green text-off-white">
            View nanny pricing
          </span>
        </Link>
      </div>
    </div>
  );
}
