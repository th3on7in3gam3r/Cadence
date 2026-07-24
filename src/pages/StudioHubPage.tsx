/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Search,
  Share2,
  Shield,
  Sparkles,
  Video,
  BookOpen,
  LayoutGrid,
  Link2,
  CreditCard,
  Globe2,
} from 'lucide-react';
import StudioBundlesPricingSection from '../components/StudioBundlesPricingSection';
import MarketingSiteShell from '../components/marketing/MarketingSiteShell';
import {
  PERSONA_OPTIONS,
  POSTWICK_PUBLIC_NOTE,
  STUDIO_HUB_PRODUCTS,
  availabilityBadge,
  productById,
  type PersonaId,
  type StudioHubProductId,
} from '../lib/studioHub';
import {
  STUDIO_BUNDLE,
  STUDIO_BUNDLE_PRODUCT_DISPLAY_ORDER,
  bundleProductNamesLine,
} from '../lib/bundles';
import { aiCmoAppUrl, aiCmoBillingPath, signalDeskHomeUrl, signalDeskPublishUrl } from '../lib/growthStack';
import { PRODUCT_NAME } from '../lib/brand';
import { useMarketingSite } from '../hooks/useMarketingSite';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_SEO } from '../lib/pageSeo';

const ICONS: Record<StudioHubProductId, React.ReactNode> = {
  ai_cmo: <Sparkles className="w-5 h-5" />,
  citepilot: <Search className="w-5 h-5" />,
  kerygma: <Share2 className="w-5 h-5" />,
  postwick: <Globe2 className="w-5 h-5" />,
  aegis: <Shield className="w-5 h-5" />,
  vesper: <Video className="w-5 h-5" />,
  rhemanote: <BookOpen className="w-5 h-5" />,
  pulpit: <LayoutGrid className="w-5 h-5" />,
};

const STUDIO_PRODUCT_LINE = bundleProductNamesLine(
  STUDIO_BUNDLE.products,
  STUDIO_BUNDLE_PRODUCT_DISPLAY_ORDER,
);

const BILLING_STEPS = [
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Pick a bundle',
    desc: `Growth, Social, DevSec, or the full Studio Bundle — checkout happens on ${PRODUCT_NAME} via Stripe.`,
  },
  {
    icon: <Link2 className="w-5 h-5" />,
    title: 'Link sister accounts',
    desc: 'Settings → Studio: confirm the same email for Kerygma & CitePilot, or GitHub username for Aegis.',
  },
  {
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: 'Use every product',
    desc: 'Entitlements fan out automatically. Manage all subscriptions in one Stripe customer portal.',
  },
];

const HUB_FAQ = [
  {
    q: `Why checkout on ${PRODUCT_NAME} instead of each product?`,
    a: 'One Stripe customer, one invoice, and bundle pricing. Sister apps receive a signed webhook to activate your plan.',
  },
  {
    q: 'I already pay for Kerygma or CitePilot separately.',
    a: 'Keep your existing plan or switch at renewal. Studio bundles are for new customers who want one bill.',
  },
  {
    q: 'What about Vesper, RhemaNote, and Pulpit?',
    a: 'Church media tools are separate SKUs today. Pulpit connects sermon → reels, posts, and study notes.',
  },
];

export default function StudioHubPage() {
  const navigate = useNavigate();
  const marketing = useMarketingSite();
  const { cloudEnabled, onTryFree } = marketing;
  const [persona, setPersona] = useState<PersonaId | null>(null);

  usePageMeta(PAGE_SEO['/studio']);

  const recommendation = persona ? PERSONA_OPTIONS.find((p) => p.id === persona) : null;
  const primary = recommendation ? productById(recommendation.primaryProduct) : null;

  const growthProducts = STUDIO_HUB_PRODUCTS.filter((p) => p.category === 'growth');
  const churchProducts = STUDIO_HUB_PRODUCTS.filter((p) => p.category !== 'growth');

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (window.location.hash === '#persona') {
      scrollTo('persona');
    }
  }, []);

  return (
    <MarketingSiteShell marketing={marketing} footerScrollTo={scrollTo}>
      {/* Hero */}
      <section className="relative border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/30 via-slate-950 to-slate-950" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[200px] bg-violet-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
            Bible Funland Studio · Growth stack bundles
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white max-w-4xl mx-auto leading-tight">
            Find it. Get cited. Strategize. Publish.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Secure it.
            </span>
          </h1>
          <p className="mt-6 text-lg font-semibold text-white max-w-3xl mx-auto leading-relaxed">
            {STUDIO_PRODUCT_LINE} — ${STUDIO_BUNDLE.monthlyListPrice}/mo total
          </p>
          <p className="mt-2 text-base text-slate-400 max-w-2xl mx-auto">
            vs ~${STUDIO_BUNDLE.separateListPrice} if bought separately. One subscription, one Stripe checkout on{' '}
            {PRODUCT_NAME}.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => scrollTo('pricing')}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-900/25 transition"
            >
              See bundle pricing
            </button>
            <button
              type="button"
              onClick={() => scrollTo('persona')}
              className="w-full sm:w-auto px-8 py-3.5 border border-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer hover:bg-slate-900 transition"
            >
              Help me choose
            </button>
          </div>
        </div>
      </section>

      <StudioBundlesPricingSection
        cloudEnabled={cloudEnabled}
        onGetStarted={onTryFree}
      />

      {/* How billing works */}
      <section className="py-16 md:py-20 border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-display font-extrabold text-white text-center">How studio billing works</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {BILLING_STEPS.map((step, i) => (
              <div key={step.title} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3 text-emerald-400">
                  {step.icon}
                  <span className="text-xs font-mono text-slate-500">Step {i + 1}</span>
                </div>
                <h3 className="mt-3 font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Persona router */}
      <section id="persona" className="py-16 md:py-20 border-b border-slate-800 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-display font-extrabold text-white text-center">What do you need?</h2>
          <p className="text-center text-slate-500 text-sm mt-2 max-w-lg mx-auto">
            Pick a persona — we&apos;ll recommend a starting product and bundle.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PERSONA_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPersona(opt.id)}
                className={`text-left p-5 rounded-xl border transition-all cursor-pointer ${
                  persona === opt.id
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <p className="text-sm font-bold text-white">{opt.label}</p>
                <p className="text-[11px] text-slate-500 mt-1">{opt.description}</p>
              </button>
            ))}
          </div>

          {recommendation && primary && (
            <div className="mt-8 p-6 md:p-8 rounded-2xl border border-amber-500/30 bg-amber-950/10">
              <p className="text-xs font-mono text-amber-400 uppercase">Recommended start</p>
              <h3 className="mt-2 text-xl font-bold text-white">{primary.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{primary.tagline}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (primary.id === 'ai_cmo') navigate('/app');
                    else window.open(primary.href, '_blank');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-900 text-sm font-bold rounded-lg cursor-pointer"
                >
                  Open {primary.name}
                  <ArrowRight className="w-4 h-4" />
                </button>
                {recommendation.bundleId && (
                  <Link
                    to={aiCmoBillingPath({ bundle: recommendation.bundleId })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-600 text-sm font-bold rounded-lg text-slate-200 hover:bg-slate-800"
                  >
                    Subscribe to bundle
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Growth products */}
      <section id="products" className="py-16 md:py-20 border-b border-slate-800 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-display font-extrabold text-white">Growth stack products</h2>
          <p className="text-slate-500 text-sm mt-2">Find → cite → strategize → publish → share → secure</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {growthProducts.map((product) => (
              <a
                key={product.id}
                href={product.id === 'ai_cmo' ? aiCmoAppUrl() : product.href}
                target={product.id === 'ai_cmo' ? undefined : '_blank'}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (product.id === 'ai_cmo') {
                    e.preventDefault();
                    navigate('/app');
                  }
                }}
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-colors"
              >
                <div className="text-amber-400 mb-2">{ICONS[product.id]}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white">{product.name}</h3>
                  {product.id === 'postwick' && (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-950 text-sky-400">
                      Public gallery
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{product.tagline}</p>
                {product.id === 'postwick' && (
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{POSTWICK_PUBLIC_NOTE}</p>
                )}
                {product.bundleId && (
                  <Link
                    to={aiCmoBillingPath({ bundle: product.bundleId })}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block mt-3 text-[11px] font-bold text-emerald-400 hover:underline"
                  >
                    View bundle pricing →
                  </Link>
                )}
              </a>
            ))}
          </div>

          <div className="mt-6 p-5 md:p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 md:flex md:items-center md:justify-between md:gap-6">
            <div className="max-w-2xl">
              <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                Connected publish desk
              </p>
              <h3 className="mt-2 text-lg font-bold text-white">Signal Desk</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Citation-ready GEO newsroom for Cadence and CitePilot — beside the Growth
                Stack, not a billed sister seat.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
              <a
                href={signalDeskHomeUrl('studio-hub', 'desk-home')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg"
              >
                Open Signal Desk
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={signalDeskPublishUrl('studio-hub', 'desk-publish')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-600 text-sm font-bold rounded-lg text-slate-200 hover:bg-slate-800"
              >
                How to publish
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Church products */}
      <section className="py-16 md:py-20 border-b border-slate-800 bg-slate-900/20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-display font-extrabold text-white">Church & ministry tools</h2>
          <p className="text-slate-500 text-sm mt-2">Sermon → reels, social, and study notes</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {churchProducts.map((product) => {
              const badge = product.availability
                ? availabilityBadge(product.availability)
                : null;
              return (
                <a
                  key={product.id}
                  href={product.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-colors"
                >
                  <div className="text-amber-400 mb-2">{ICONS[product.id]}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white">{product.name}</h3>
                    {badge && (
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{product.tagline}</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-display font-extrabold text-white text-center mb-8">Bundle FAQ</h2>
          <div className="space-y-3">
            {HUB_FAQ.map((item) => (
              <details
                key={item.q}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 open:border-slate-700"
              >
                <summary className="font-bold text-white cursor-pointer list-none">{item.q}</summary>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Connect CTA */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center p-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
          <h2 className="text-xl font-bold text-white">Ready to connect your stack?</h2>
          <p className="text-sm text-slate-400 mt-2">
            Sign in to {PRODUCT_NAME}, link sister products, and manage billing in one place.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/app/settings?tab=studio"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition"
            >
              Connect products
            </Link>
            <Link
              to="/app/settings?tab=billing"
              className="px-6 py-3 border border-slate-700 text-sm font-bold rounded-lg text-slate-200 hover:bg-slate-800 transition"
            >
              Manage billing
            </Link>
          </div>
        </div>
      </section>
    </MarketingSiteShell>
  );
}
