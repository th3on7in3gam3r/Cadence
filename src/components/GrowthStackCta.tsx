/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Layers, Newspaper } from 'lucide-react';
import { bundleCheckoutHref } from '../lib/bundles';
import {
  GROWTH_STACK_TEASER_PILLS,
  SIGNAL_DESK_SPOTLIGHT,
} from '../data/growthStackPromo';
import { PRODUCT_NAME } from '../lib/brand';

interface GrowthStackCtaProps {
  cloudEnabled?: boolean;
  onGetStarted: () => void;
}

export default function GrowthStackCta({ cloudEnabled, onGetStarted }: GrowthStackCtaProps) {
  const checkoutHref = bundleCheckoutHref('growth');

  return (
    <section
      id="growth-stack"
      className="py-16 md:py-20 border-b border-violet-900/30 bg-gradient-to-br from-violet-950/50 via-slate-950 to-slate-950 scroll-mt-16"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 p-6 md:p-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative">
            <p className="inline-flex items-center gap-2 text-xs font-mono text-violet-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              Bible Funland Growth Stack
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-display font-extrabold text-white leading-tight max-w-2xl">
              Strategy, citations, publishing, and distribution — connected
            </h2>
            <p className="mt-3 text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl">
              {PRODUCT_NAME}, CitePilot, Signal Desk Blog, and sister studio apps share one brand URL.
              Find gaps, get cited in AI answers, publish GEO posts, and measure what lands.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {GROWTH_STACK_TEASER_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-[11px] font-semibold text-slate-300"
                >
                  {pill}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-[11px] font-semibold text-slate-500">
                + more
              </span>
            </div>

            <div className="mt-6 p-4 rounded-xl border border-emerald-500/25 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <Newspaper className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">{SIGNAL_DESK_SPOTLIGHT.name}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Publish {PRODUCT_NAME} blog drafts to your citation-ready newsroom — included, not a
                    billed seat.
                  </p>
                </div>
              </div>
              <a
                href={SIGNAL_DESK_SPOTLIGHT.openUrl('landing-teaser')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 shrink-0"
              >
                signaldeskblog.com
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/growth-stack"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg shadow-violet-900/30"
              >
                Explore the Growth Stack
                <ArrowRight className="w-4 h-4" />
              </Link>
              {cloudEnabled ? (
                <Link
                  to={checkoutHref}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl transition"
                >
                  Get Growth Stack bundle
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer"
                >
                  Get Growth Stack bundle
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
