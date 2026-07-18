/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { buildFaqList } from '../../data/landingFaq';

interface LandingFaqSectionProps {
  cloudEnabled?: boolean;
}

export default function LandingFaqSection({ cloudEnabled }: LandingFaqSectionProps) {
  const faq = buildFaqList(cloudEnabled);

  return (
    <section id="faq" className="py-20 md:py-28 border-b border-slate-800 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h2 className="text-3xl font-display font-extrabold text-white text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {faq.map((item) => (
            <details
              key={item.q}
              className="group p-5 rounded-xl bg-slate-900 border border-slate-800 open:border-slate-700"
            >
              <summary className="font-display font-bold text-white cursor-pointer list-none flex justify-between items-center gap-4">
                {item.q}
                <ChevronRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition shrink-0" />
              </summary>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
