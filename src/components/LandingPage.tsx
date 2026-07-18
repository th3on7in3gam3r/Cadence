/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Zap,
  Target,
  Package,
} from 'lucide-react';
import CadencePricingSection from './CadencePricingSection';
import GrowthStackCta from './GrowthStackCta';
import MarketingSiteShell from './marketing/MarketingSiteShell';
import LandingHeroPreview from './LandingHeroPreview';
import LandingFeaturesSection from './landing/LandingFeaturesSection';
import LandingHowItWorksSection from './landing/LandingHowItWorksSection';
import LandingFaqSection from './landing/LandingFaqSection';
import LandingTrustBar from './landing/LandingTrustBar';
import LandingSocialProof from './LandingSocialProof';
import LandingStackComparison from './LandingStackComparison';
import JsonLd from './seo/JsonLd';
import { CONTENT_STUDIO_CALLOUT, GENERATOR_STATS_SUBLINE } from '../data/landingGenerators';
import { buildCadenceSoftwareApplicationSchema } from '../data/structuredData';
import { useMarketingSite } from '../hooks/useMarketingSite';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_SEO } from '../lib/pageSeo';
import { PRODUCT_NAME } from '../lib/brand';

export default function LandingPage() {
  const location = useLocation();
  const marketing = useMarketingSite();
  const { cloudEnabled, onTryFree, onSignIn } = marketing;

  usePageMeta(PAGE_SEO['/']);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace(/^#/, '');
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [location.hash]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const primaryLabel = cloudEnabled ? 'Analyze your site free' : 'Start free — analyze your site';
  const freemiumNote = cloudEnabled
    ? 'Free plan · 1 brand · 3 SEO audits/mo · No credit card'
    : 'Self-hosted · Bring your own Gemini API key · No credit card';

  return (
    <MarketingSiteShell marketing={marketing} footerScrollTo={scrollTo}>
      <JsonLd data={buildCadenceSoftwareApplicationSchema()} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 mb-6"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Strategy · SEO · Content · One workspace
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.08]"
              >
                Your AI marketing department —{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  from URL to launch-ready copy
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-5 text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Analyze any brand, audit SEO, and generate blogs, social posts, emails, and keyword plans —
                without juggling five different tools.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
              >
                <button
                  type="button"
                  onClick={onTryFree}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition"
                >
                  {primaryLabel}
                  <ChevronRight className="w-4 h-4" />
                </button>
                <Link
                  to="/how-it-works"
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl transition text-center"
                >
                  See how it works
                </Link>
              </motion.div>
              <p className="mt-4 text-xs text-slate-500 font-mono">{freemiumNote}</p>
              {cloudEnabled && (
                <p className="mt-2 text-xs text-slate-500">
                  Already have an account?{' '}
                  <button type="button" onClick={onSignIn} className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">
                    Sign in
                  </button>
                </p>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <LandingHeroPreview />
            </motion.div>
          </div>
        </div>
      </section>

      <LandingTrustBar />

      {/* Proof strip */}
      <section className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Brand analysis', value: '< 2 min', subline: undefined },
            { label: 'SEO page crawl', value: 'Up to 20 pages', subline: undefined },
            { label: 'Content types', value: '5 generators', subline: GENERATOR_STATS_SUBLINE },
            { label: 'Export', value: 'Campaign ZIP', subline: undefined },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl md:text-2xl font-display font-black text-white">{stat.value}</p>
              <p className="text-[11px] text-slate-500 font-mono uppercase mt-1 tracking-wide">{stat.label}</p>
              {stat.subline && (
                <p className="text-[10px] text-slate-500 font-mono mt-1.5 normal-case tracking-normal leading-snug px-1">
                  {stat.subline}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="max-w-6xl mx-auto px-4 md:px-6 pb-5 text-center text-xs text-slate-500">
          <strong className="text-slate-400 font-semibold">Content studio:</strong> {CONTENT_STUDIO_CALLOUT}
        </p>
      </section>

      <LandingSocialProof />
      <LandingFeaturesSection />
      <LandingHowItWorksSection />
      <LandingStackComparison />
      <CadencePricingSection cloudEnabled={cloudEnabled} onGetStarted={onTryFree} />
      <GrowthStackCta cloudEnabled={cloudEnabled} onGetStarted={onTryFree} />

      {/* Value props */}
      <section className="py-20 md:py-28 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-display font-extrabold text-white leading-tight">
              Built for founders who wear the marketing hat
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                { icon: <Target className="w-4 h-4 text-emerald-400" />, text: 'SWOT, audience, and channel plan — explained simply' },
                { icon: <Zap className="w-4 h-4 text-amber-400" />, text: 'AI specialists for strategy, SEO, conversions, and copy' },
                { icon: <Package className="w-4 h-4 text-blue-400" />, text: 'One-click ZIP export with version history' },
                { icon: <CheckCircle2 className="w-4 h-4 text-teal-400" />, text: 'Connect GSC, GA4 & keyword tools in the SEO Agent' },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 shrink-0">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/20">
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-3">Live preview</p>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                <span className="text-emerald-400">→</span> Analyzing https://yourbrand.com …
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Campaign readiness: <span className="text-white font-bold">B+ 78%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Generated: SEO keywords · Blog draft · Email sequence
              </div>
            </div>
            <button
              type="button"
              onClick={onTryFree}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer transition"
            >
              Try it on your site
            </button>
          </div>
        </div>
      </section>

      <LandingFaqSection cloudEnabled={cloudEnabled} />

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">
            Ready to run marketing like a pro?
          </h2>
          <p className="mt-4 text-slate-400">
            Paste your URL and let {PRODUCT_NAME} build the plan — free to start.
          </p>
          <button
            type="button"
            onClick={onTryFree}
            className="mt-8 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer inline-flex items-center gap-2 transition shadow-lg shadow-emerald-900/25"
          >
            {primaryLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </MarketingSiteShell>
  );
}
