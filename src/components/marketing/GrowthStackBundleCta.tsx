/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Layers, Search, Sparkles } from 'lucide-react';
import { bundleCheckoutHref, MARKETING_BUNDLES } from '../../lib/bundles';
import { GROWTH_STACK_PRODUCTS } from '../../lib/growthStack';
import { PRODUCT_NAME } from '../../lib/brand';

interface GrowthStackBundleCtaProps {
  cloudEnabled?: boolean;
  onGetStarted: () => void;
}

const GROWTH_BUNDLE = MARKETING_BUNDLES.find((b) => b.id === 'growth')!;

export default function GrowthStackBundleCta({
  cloudEnabled,
  onGetStarted,
}: GrowthStackBundleCtaProps) {
  const checkoutHref = bundleCheckoutHref('growth');

  return (
    <section className="py-16 md:py-20 border-b border-violet-900/30 bg-gradient-to-br from-violet-950/50 via-slate-950 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 p-6 md:p-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-mono text-violet-400 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                Bible Funland Studio bundle
              </p>
              <h2 className="mt-3 text-2xl md:text-3xl font-display font-extrabold text-white leading-tight">
                {GROWTH_BUNDLE.name} — strategy and AI citations together
              </h2>
              <p className="mt-3 text-sm md:text-base text-slate-400 leading-relaxed max-w-xl">
                Pair {PRODUCT_NAME} Pro with {GROWTH_STACK_PRODUCTS.citePilot.name} for content-led SEO and
                visibility in AI buyer prompts — one subscription, shared brand URL. Publish to Signal Desk
                Blog from {PRODUCT_NAME} at no extra seat cost.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-xs font-bold text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  {PRODUCT_NAME} Pro
                </span>
                <span className="text-slate-600 text-xs font-mono">+</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-xs font-bold text-cyan-400">
                  <Search className="w-3.5 h-3.5" />
                  {GROWTH_STACK_PRODUCTS.citePilot.name}
                </span>
              </div>

              <ul className="mt-6 space-y-2">
                {GROWTH_BUNDLE.features.slice(0, 3).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:text-right shrink-0">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">One monthly total</p>
              <p className="mt-1 flex items-baseline gap-1 lg:justify-end">
                <span className="text-5xl font-display font-black text-white">
                  ${GROWTH_BUNDLE.monthlyListPrice}
                </span>
                <span className="text-sm text-slate-500">/mo</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Not priced per app</p>

              {cloudEnabled ? (
                <Link
                  to={checkoutHref}
                  className="mt-6 w-full lg:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg shadow-violet-900/30"
                >
                  Get {GROWTH_BUNDLE.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="mt-6 w-full lg:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg shadow-violet-900/30 cursor-pointer"
                >
                  Get started with {GROWTH_BUNDLE.name}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <p className="mt-4 text-xs text-slate-500">
                Need all four apps?{' '}
                <Link to="/studio#pricing" className="text-violet-400 hover:text-violet-300 font-semibold">
                  See Studio Bundle
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
