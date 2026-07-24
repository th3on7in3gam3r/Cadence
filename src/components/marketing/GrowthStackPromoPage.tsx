/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Globe2,
  Layers,
  Newspaper,
  Search,
  Share2,
  Shield,
  Sparkles,
} from 'lucide-react';
import StudioBundlesPricingSection from '../StudioBundlesPricingSection';
import GrowthStackBundleCta from './GrowthStackBundleCta';
import {
  GROWTH_STACK_HERO,
  GROWTH_STACK_WORKFLOW,
  SIGNAL_DESK_SPOTLIGHT,
  growthStackProductCards,
  type GrowthStackProductCard,
} from '../../data/growthStackPromo';
import { BIBLEFUNLAND_STUDIOS_URL } from '../../lib/growthStack';
import { PRODUCT_NAME } from '../../lib/brand';

const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  aiCmo: <Sparkles className="w-5 h-5" />,
  citePilot: <Search className="w-5 h-5" />,
  kerygma: <Share2 className="w-5 h-5" />,
  postwick: <Globe2 className="w-5 h-5" />,
  aegis: <Shield className="w-5 h-5" />,
  pulse: <Activity className="w-5 h-5" />,
};

interface GrowthStackPromoPageProps {
  cloudEnabled?: boolean;
  onGetStarted: () => void;
}

function ProductCard({ card }: { card: GrowthStackProductCard }) {
  const icon = PRODUCT_ICONS[card.id];
  const inner = (
    <>
      <div className={`flex items-center gap-2 mb-2 ${card.accentClass}`}>
        {icon}
        <span className="text-xs font-mono uppercase tracking-wider">
          {card.badge || 'Sister product'}
        </span>
      </div>
      {card.logoSrc && (
        <img
          src={card.logoSrc}
          alt=""
          className="h-6 w-auto mb-2 opacity-90"
          loading="lazy"
        />
      )}
      <h3 className="font-display font-bold text-white">{card.name}</h3>
      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{card.tagline}</p>
      {card.id !== 'aiCmo' && (
        <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-slate-500 group-hover:text-slate-300">
          Learn more
          <ExternalLink className="w-3 h-3" />
        </span>
      )}
      {card.id === 'aiCmo' && (
        <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
          Open workspace
          <ChevronRight className="w-3 h-3" />
        </span>
      )}
    </>
  );

  const className = `group p-5 rounded-2xl bg-slate-900 border transition-colors block h-full ${card.borderClass}`;

  if (card.external) {
    return (
      <a href={card.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <a href={card.href} className={className}>
      {inner}
    </a>
  );
}

export default function GrowthStackPromoPage({
  cloudEnabled,
  onGetStarted,
}: GrowthStackPromoPageProps) {
  const products = growthStackProductCards('growth-stack-page');

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/40 via-slate-950 to-slate-950" />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="inline-flex items-center gap-2 text-xs font-mono text-violet-400 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            {GROWTH_STACK_HERO.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.08] max-w-3xl">
            {GROWTH_STACK_HERO.title}
          </h1>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl leading-relaxed">
            {GROWTH_STACK_HERO.subtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#products"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg shadow-violet-900/30"
            >
              Explore products
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl transition"
            >
              View bundle pricing
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Part of{' '}
            <a
              href={BIBLEFUNLAND_STUDIOS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30"
            >
              Bible Funland Studios
            </a>
            {' · '}
            <Link to="/studio" className="text-violet-400 hover:text-violet-300 underline">
              Open studio hub
            </Link>
          </p>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-14 md:py-16 border-b border-slate-800 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-center text-2xl md:text-3xl font-display font-extrabold text-white">
            Find → cite → create → publish → distribute → measure
          </h2>
          <p className="text-center text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Each tool does one job well. Together they cover the full growth loop for your brand URL.
          </p>
          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GROWTH_STACK_WORKFLOW.map((step, index) => (
              <li
                key={step.id}
                className="relative p-4 rounded-xl bg-slate-900 border border-slate-800"
              >
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                  Step {index + 1} · {step.label}
                </span>
                <p className="mt-1 text-sm font-bold text-white">{step.product}</p>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Product grid */}
      <section id="products" className="py-16 md:py-20 border-b border-slate-800 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white">
              Studio products for every stage
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Use {PRODUCT_NAME} as your command center. Add sister apps where you need citations,
              social, security, or analytics — same brand URL throughout.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((card) => (
              <ProductCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </section>

      {/* Signal Desk spotlight */}
      <section className="py-14 md:py-16 border-b border-slate-800 bg-slate-950/30">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="p-6 md:p-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 md:flex md:items-center md:justify-between md:gap-8">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                <Newspaper className="w-3.5 h-3.5" />
                {SIGNAL_DESK_SPOTLIGHT.eyebrow}
              </p>
              <h2 className="mt-2 text-xl md:text-2xl font-display font-extrabold text-white">
                {SIGNAL_DESK_SPOTLIGHT.name}
              </h2>
              <p className="mt-2 text-sm font-semibold text-emerald-300/90">
                {SIGNAL_DESK_SPOTLIGHT.tagline}
              </p>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                {SIGNAL_DESK_SPOTLIGHT.description}
              </p>
              <p className="mt-2 text-xs text-slate-500">{SIGNAL_DESK_SPOTLIGHT.integrationNote}</p>
              <a
                href={SIGNAL_DESK_SPOTLIGHT.homeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs font-mono text-emerald-400/80 hover:text-emerald-300"
              >
                {SIGNAL_DESK_SPOTLIGHT.homeUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
              <a
                href={SIGNAL_DESK_SPOTLIGHT.openUrl('growth-stack-page')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition"
              >
                Open Signal Desk Blog
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={SIGNAL_DESK_SPOTLIGHT.publishUrl('growth-stack-page')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 border border-slate-600 text-sm font-bold rounded-xl text-slate-200 hover:bg-slate-800 transition"
              >
                How to publish
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle CTA */}
      <GrowthStackBundleCta cloudEnabled={cloudEnabled} onGetStarted={onGetStarted} />

      {/* Full pricing */}
      <StudioBundlesPricingSection
        id="pricing"
        showSoloPlans={false}
        title="Bundle pricing — one bill, multiple products"
        subtitle={`Subscribe to Growth Stack (${PRODUCT_NAME} + CitePilot) or the full Studio Bundle. Signal Desk Blog publishing is included — connect it free in Settings → Integrations.`}
        cloudEnabled={cloudEnabled}
        onGetStarted={onGetStarted}
      />
    </>
  );
}
