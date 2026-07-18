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
  Layers,
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
import MarketingFooter from '../components/MarketingFooter';
import {
  PERSONA_OPTIONS,
  STUDIO_HUB_PRODUCTS,
  productById,
  type PersonaId,
  type StudioHubProductId,
} from '../lib/studioHub';
import { aiCmoAppUrl, aiCmoBillingPath } from '../lib/growthStack';
import { PRODUCT_NAME } from '../lib/brand';
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="text-sm font-display font-extrabold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Bible Funland Studio
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-xs text-slate-400">
            <button type="button" onClick={() => scrollTo('pricing')} className="hover:text-white cursor-pointer">
              Pricing
            </button>
            <button type="button" onClick={() => scrollTo('products')} className="hover:text-white cursor-pointer">
              Products
            </button>
            <button type="button" onClick={() => scrollTo('persona')} className="hover:text-white cursor-pointer">
              Find your fit
            </button>
            <Link to="/" className="hover:text-white">
              {PRODUCT_NAME} home
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollTo('pricing')}
              className="hidden sm:inline-flex text-xs font-bold text-violet-300 hover:text-white px-3 py-2 cursor-pointer"
            >
              View bundles
            </button>
            <Link
              to="/app"
              className="px-3 py-2 bg-amber-500 text-slate-900 text-xs font-bold rounded-lg"
            >
              Open {PRODUCT_NAME}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/50 via-slate-950 to-slate-950" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <p className="text-xs font-mono text-violet-400 uppercase tracking-wider">
            Bible Funland Studios · Growth stack
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white max-w-4xl mx-auto leading-tight">
            Find it. Get cited. Strategize. Publish.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-300">
              Secure it.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Aegis Loop, CitePilot, {PRODUCT_NAME}, Kerygma Social, and Postwick — plus church media tools — in one
            studio family. Bundle pricing with a single Stripe checkout on {PRODUCT_NAME}.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => scrollTo('pricing')}
              className="w-full sm:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl cursor-pointer"
            >
              See studio bundle pricing
            </button>
            <button
              type="button"
              onClick={() => scrollTo('persona')}
              className="w-full sm:w-auto px-8 py-3.5 border border-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer hover:bg-slate-900"
            >
              Help me choose
            </button>
          </div>
        </div>
      </section>

      {/* Pricing — above the fold on scroll */}
      <StudioBundlesPricingSection
        title="Studio bundles — visible pricing, one checkout"
        subtitle="Four bundles for the marketing growth stack. Subscribe below (sign in required). Sister products activate when you link the same email in Settings → Studio."
      />

      {/* How billing works */}
      <section className="py-16 md:py-20 border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-display font-extrabold text-white text-center">How studio billing works</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {BILLING_STEPS.map((step, i) => (
              <div key={step.title} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3 text-violet-400">
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
                className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/40 transition-colors"
              >
                <div className="text-amber-400 mb-2">{ICONS[product.id]}</div>
                <h3 className="font-bold text-white">{product.name}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{product.tagline}</p>
                {product.bundleId && (
                  <Link
                    to={aiCmoBillingPath({ bundle: product.bundleId })}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block mt-3 text-[11px] font-bold text-violet-400 hover:underline"
                  >
                    View bundle pricing →
                  </Link>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Church products */}
      <section className="py-16 md:py-20 border-b border-slate-800 bg-slate-900/20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-display font-extrabold text-white">Church & ministry tools</h2>
          <p className="text-slate-500 text-sm mt-2">Sermon → reels, social, and study notes</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {churchProducts.map((product) => (
              <a
                key={product.id}
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-colors"
              >
                <div className="text-amber-400 mb-2">{ICONS[product.id]}</div>
                <h3 className="font-bold text-white">{product.name}</h3>
                <p className="text-xs text-slate-500 mt-2">{product.tagline}</p>
              </a>
            ))}
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
        <div className="max-w-3xl mx-auto px-4 text-center p-8 rounded-2xl border border-violet-500/30 bg-violet-950/10">
          <h2 className="text-xl font-bold text-white">Ready to connect your stack?</h2>
          <p className="text-sm text-slate-400 mt-2">
            Sign in to {PRODUCT_NAME}, link sister products, and manage billing in one place.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/app/settings?tab=studio"
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg"
            >
              Connect products
            </Link>
            <Link
              to="/app/settings?tab=billing"
              className="px-6 py-3 border border-slate-700 text-sm font-bold rounded-lg text-slate-200 hover:bg-slate-800"
            >
              Manage billing
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter variant="studio" onScrollTo={scrollTo} />
    </div>
  );
}
