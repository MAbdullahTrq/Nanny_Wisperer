import Link from 'next/link';

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-lg">
      <svg viewBox="0 0 400 320" className="w-full h-auto" aria-hidden>
        <defs>
          <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C8D5C4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#EAD5D1" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3F4C44" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3F4C44" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <ellipse cx="200" cy="260" rx="140" ry="50" fill="url(#accentGrad)" />
        <circle cx="120" cy="140" r="50" fill="url(#heroGrad)" stroke="#C8D5C4" strokeWidth="2" />
        <circle cx="280" cy="120" r="45" fill="url(#heroGrad)" stroke="#EAD5D1" strokeWidth="2" />
        <path
          d="M85 220 Q120 180 160 200 Q200 220 240 190 Q280 160 320 200"
          fill="none"
          stroke="#3F4C44"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
        <circle cx="200" cy="80" r="25" fill="#EAD5D1" opacity="0.8" />
        <path
          d="M180 200 L220 200 L220 260 L180 260 Z"
          fill="#C8D5C4"
          stroke="#3F4C44"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <path
          d="M100 240 L140 200 L180 240 L140 280 Z"
          fill="#EAD5D1"
          stroke="#3F4C44"
          strokeWidth="1"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

function PricingCard({
  title,
  description,
  cta,
  href,
  accent,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
  accent: 'green' | 'pink';
}) {
  const bg = accent === 'green' ? 'bg-light-green/30 border-light-green' : 'bg-light-pink/30 border-light-pink';
  return (
    <div className={`rounded-2xl border-2 p-6 ${bg}`}>
      <h3 className="font-display text-xl font-semibold text-dark-green mb-2">{title}</h3>
      <p className="text-dark-green/90 text-sm mb-4">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium bg-dark-green text-off-white hover:bg-dark-green/90 transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <section className="relative max-w-6xl mx-auto px-4 py-16 lg:py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-light-green/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-light-pink/25 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" aria-hidden />
        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-dark-green mb-4">
              Join the Private Network
            </h1>
            <p className="text-dark-green/90 max-w-xl text-lg mb-8">
              Nanny Whisperer connects families with trusted nannies through a private,
              curated matchmaking experience. No public browsing — just thoughtful
              introductions.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup/host"
                className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium bg-dark-green text-off-white hover:bg-dark-green/90 transition-colors"
              >
                I&apos;m a Host
              </Link>
              <Link
                href="/signup/nanny"
                className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium bg-light-green text-pastel-black hover:bg-light-green/80 border-2 border-light-green transition-colors"
              >
                I&apos;m a Nanny
              </Link>
            </div>
          </div>
          <HeroIllustration />
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16 scroll-mt-8">
        <h2 className="font-display text-3xl font-semibold text-dark-green text-center mb-10">
          Get started
        </h2>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <PricingCard
            title="For families"
            description="Find your ideal nanny through curated shortlists and direct messaging."
            cta="Sign up as Host"
            href="/signup/host"
            accent="green"
          />
          <PricingCard
            title="For nannies"
            description="Join a private network of families looking for trusted childcare."
            cta="Sign up as Nanny"
            href="/signup/nanny"
            accent="pink"
          />
        </div>
      </section>
    </div>
  );
}
