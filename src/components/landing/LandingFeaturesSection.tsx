/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart3, FileText, Layers, Search } from 'lucide-react';

const FEATURES = [
  {
    icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
    title: 'Strategy dashboard',
    desc: 'Your brand strategy in plain English — strengths, gaps, audience, and a 4-week plan.',
  },
  {
    icon: <Search className="w-5 h-5 text-teal-400" />,
    title: 'SEO AI Agent',
    desc: 'Crawl your site, fix technical issues, find keyword gaps, and rewrite meta tags.',
  },
  {
    icon: <FileText className="w-5 h-5 text-blue-400" />,
    title: 'Content studio',
    desc: 'Generate blogs, social posts, emails, keywords, and lead magnets — ready to edit.',
  },
  {
    icon: <Layers className="w-5 h-5 text-amber-400" />,
    title: 'Campaign history',
    desc: 'Version every draft, compare changes, and export a full campaign ZIP.',
  },
];

export default function LandingFeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 border-b border-slate-800 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">
            Everything a CMO team does — in one app
          </h2>
          <p className="mt-4 text-slate-400">
            No more switching between SEO tools, docs, and chatbots. Plan, create, and ship from one workspace.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="p-2.5 w-fit rounded-xl bg-slate-950 border border-slate-800 mb-4">{f.icon}</div>
              <h3 className="text-lg font-display font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
