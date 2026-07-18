/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const STEPS = [
  { n: '1', title: 'Paste your URL', desc: 'AI reads your site and builds a marketing strategy in minutes.' },
  { n: '2', title: 'Run SEO & create content', desc: 'Audit pages, fix gaps, then generate copy your team can ship.' },
  { n: '3', title: 'Export & iterate', desc: 'Download everything or refine with your AI marketing team.' },
];

export default function LandingHowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 border-b border-slate-800 bg-slate-900/30 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">How it works</h2>
          <p className="mt-4 text-slate-400">Three steps from homepage to published campaign assets.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.n} className="relative text-center md:text-left">
              <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-display font-black text-lg mb-4">
                {step.n}
              </span>
              <h3 className="text-lg font-display font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
