'use client';

import { useState } from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2 max-w-2xl mx-auto">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border-2 border-light-green/40 bg-off-white overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full px-4 py-3 text-left flex items-center justify-between gap-2 font-medium text-dark-green hover:bg-light-green/20 transition-colors"
            aria-expanded={openIndex === i}
          >
            <span>{item.question}</span>
            <span
              className={`flex-shrink-0 text-dark-green transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
              aria-hidden
            >
              ▼
            </span>
          </button>
          {openIndex === i && (
            <div className="px-4 pb-3 pt-0 text-sm text-dark-green/90 border-t border-light-green/30">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
