/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import CadencePricingSection from '../components/CadencePricingSection';
import MarketingFooter from '../components/MarketingFooter';
import JsonLd from '../components/seo/JsonLd';
import { buildCadenceSoftwareApplicationSchema } from '../data/structuredData';
import { usePageMeta } from '../hooks/usePageMeta';
import { useTryFree } from '../hooks/useTryFree';
import { useAuth } from '../contexts/AuthContext';
import { PAGE_SEO } from '../lib/pageSeo';
import { PRODUCT_NAME, PRODUCT_TAGLINE, showGrowthStackUi } from '../lib/brand';

export default function PricingPage() {
  const { cloudEnabled } = useAuth();
  const onTryFree = useTryFree();
  const stackUi = showGrowthStackUi();

  usePageMeta(PAGE_SEO['/pricing']);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <JsonLd data={buildCadenceSoftwareApplicationSchema()} />

      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-emerald-400 group-hover:border-slate-700 transition">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-bold text-white text-[15px] leading-none tracking-tight block">
                  {PRODUCT_NAME}
                </span>
                <span className="text-[10px] font-medium text-slate-500 tracking-wide hidden sm:block mt-0.5">
                  {PRODUCT_TAGLINE}
                </span>
              </div>
            </Link>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            <Link to="/" className="px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-white transition-colors">
              Home
            </Link>
            {stackUi && (
              <Link to="/studio" className="px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-white transition-colors">
                Studio apps
              </Link>
            )}
            <button
              type="button"
              onClick={() => void onTryFree()}
              className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-full transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Try free
            </button>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <CadencePricingSection cloudEnabled={cloudEnabled} onGetStarted={() => void onTryFree()} />
      </main>

      <MarketingFooter onGetStarted={() => void onTryFree()} />
    </div>
  );
}
