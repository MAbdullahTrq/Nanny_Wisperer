export interface Step {
  number: number;
  title: string;
  description: string;
}

export default function HowItWorksSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-2 items-stretch">
      {steps.map((step, i) => (
        <div key={step.number} className="flex items-center gap-2 flex-1 min-w-[200px] max-w-[240px]">
          <div className="rounded-xl bg-light-green/50 border-2 border-light-green px-4 py-3 flex-shrink-0 text-center">
            <span className="block text-2xl font-display font-semibold text-dark-green">{step.number}</span>
            <span className="block text-sm font-medium text-dark-green mt-0.5">{step.title}</span>
            <span className="block text-xs text-dark-green/80 mt-1">{step.description}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="hidden md:block flex-shrink-0 text-dark-green/50" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
