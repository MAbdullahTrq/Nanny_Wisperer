import Link from 'next/link';
import {
  TierCard,
  HowItWorksSteps,
  FAQAccordion,
  CuratedNetworkBox,
} from '@/components/pricing';

export const metadata = {
  title: 'Pricing for Nannies | Nanny Whisperer',
  description: 'Find your next family through the private network. Standard, Fast Track, and VIP tiers.',
};

const nannyTiers = [
  {
    name: 'Standard',
    price: '€20/year',
    features: [
      'Shortlist opportunities within 5 days',
      'Ongoing curated family matches',
      'Text-only private chat (self-managed)',
    ],
    ctaLabel: 'Join Standard',
    ctaHref: '/signup/nanny',
    variant: 'pink' as const,
  },
  {
    name: 'Fast Track',
    price: '€500',
    features: [
      'Shortlist within 24 hours',
      'Priority in matching queue',
      'Contract templates included',
      'Two-way video call scheduling',
    ],
    ctaLabel: 'Upgrade to Fast Track',
    ctaHref: '/signup/nanny',
    variant: 'green' as const,
  },
  {
    name: 'VIP',
    price: '€3000',
    features: [
      'Shortlist within 12 hours',
      'Concierge-reviewed matches + profile refinement',
      'Prefilled contracts & onboarding support',
      'Three-way monitored call (Host + Nanny + Guru)',
    ],
    ctaLabel: 'Get VIP Concierge',
    ctaHref: '/signup/nanny',
    variant: 'white' as const,
    badge: 'vip' as const,
  },
];

const nannyHowItWorks = [
  { number: 1, title: 'Join', description: 'Trial or Standard membership' },
  { number: 2, title: 'Onboarding', description: 'Tell us your experience and preferences' },
  { number: 3, title: 'Shortlist', description: 'Curated family profiles delivered to you' },
  { number: 4, title: 'Interviews', description: 'Fast Track/VIP includes video calls' },
];

const nannySupportTiers = [
  { name: 'Standard', items: ['Text-only private chat', 'Fully self-managed'] },
  { name: 'Fast Track', items: ['Two-way video calls', 'Automated scheduling', 'Verification support'] },
  { name: 'VIP', items: ['Three-way monitored call', 'Concierge moderation and follow-up'] },
];

const nannyFAQ = [
  {
    question: 'Do I get open search access?',
    answer:
      "No—we don't offer open browsing. We deliver curated family matches based on your profile and preferences, directly to your inbox.",
  },
  {
    question: 'How quickly will I receive matches?',
    answer:
      'Standard receives the first shortlist within 5 days (typically 3). Fast Track is within 24 hours, and VIP within 12 hours.',
  },
  {
    question: 'Can I upgrade later?',
    answer:
      'Yes. You can start with Standard and upgrade to Fast Track or VIP at any time if you want faster visibility and more support.',
  },
  {
    question: 'Is the free trial really no card?',
    answer:
      "Yes—the trial requires no card. It provides limited access so you can explore how the network works before upgrading.",
  },
  {
    question: 'What happens after I join?',
    answer:
      "After you join, you complete the onboarding form with your experience, availability, and preferences. Then we begin curated matching according to your chosen tier.",
  },
];

export default function NannyPricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid lg:grid-cols-[1fr,320px] gap-10 items-start">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl font-semibold text-dark-green mb-4">
              Find your next family through The Nanny Whisperer network
            </h1>
            <p className="text-dark-green/90 text-lg max-w-xl mb-6">
              We match you with families that fit your experience and preferences — no endless
              applications. Get shortlisted, interview, and land the right role at your pace.
            </p>
            <div className="flex flex-wrap gap-4 mb-4">
              <Link
                href="/signup/nanny"
                className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium border-2 border-light-pink bg-off-white text-dark-green hover:bg-light-pink/20 transition-colors"
              >
                30-Day Free Trial (no card required)
              </Link>
              <Link
                href="/signup/nanny"
                className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-medium bg-dark-green text-off-white hover:bg-dark-green/90 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
            <p className="text-sm text-dark-green/80">
              Limited access to explore how the network works. Upgrade when you&apos;re ready to start matching.
            </p>
          </div>
          <CuratedNetworkBox
            title="Curated matching network"
            subtitle="Shortlists, interviews & contracts – at your pace"
            items={[
              { tier: 'Standard', description: 'steady curated matches' },
              { tier: 'Fast Track', description: 'faster shortlist + video calls' },
              { tier: 'VIP', description: 'concierge + monitored interviews' },
            ]}
          />
        </div>
      </section>

      {/* Membership Tiers */}
      <section id="tiers" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-8">
        <h2 className="font-display text-3xl font-semibold text-dark-green text-center mb-2">
          Membership Tiers
        </h2>
        <p className="text-dark-green/90 text-center mb-10">
          Curated matching included in all tiers – upgrade for speed and concierge support.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {nannyTiers.map((tier) => (
            <TierCard key={tier.name} {...tier} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-8">
        <h2 className="font-display text-3xl font-semibold text-dark-green text-center mb-10">
          How it works
        </h2>
        <HowItWorksSteps steps={nannyHowItWorks} />
      </section>

      {/* Calls & Support by Tier */}
      <section className="bg-light-green/30 border-y-2 border-light-green/50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-2xl font-semibold text-dark-green text-center mb-8">
            Calls & Support by Tier
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {nannySupportTiers.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border-2 border-dark-green/20 bg-off-white p-5"
              >
                <h3 className="font-display font-semibold text-dark-green uppercase tracking-wide text-sm mb-3">
                  {t.name}
                </h3>
                <ul className="space-y-1 text-sm text-dark-green/90">
                  {t.items.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <p className="text-center text-sm font-medium text-dark-green/80 uppercase tracking-wide mb-1">
          Still not sure?
        </p>
        <h2 className="font-display text-3xl font-semibold text-dark-green text-center mb-10">
          Frequently Asked Questions
        </h2>
        <FAQAccordion items={nannyFAQ} />
      </section>
    </div>
  );
}
