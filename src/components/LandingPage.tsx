/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BrainCircuit,
  ArrowRight,
  Search,
  FileText,
  BarChart3,
  Layers,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Zap,
  Target,
  Package,
} from 'lucide-react';
import CadencePricingSection from './CadencePricingSection';
import MarketingFooter from './MarketingFooter';
import { PRODUCT_NAME, PRODUCT_SUBTITLE, PRODUCT_TAGLINE, showGrowthStackUi } from '../lib/brand';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenWorkspace: () => void;
  onSignIn?: () => void;
  hasWorkspace?: boolean;
  cloudEnabled?: boolean;
}

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

const STEPS = [
  { n: '1', title: 'Paste your URL', desc: 'AI reads your site and builds a marketing strategy in minutes.' },
  { n: '2', title: 'Run SEO & create content', desc: 'Audit pages, fix gaps, then generate copy your team can ship.' },
  { n: '3', title: 'Export & iterate', desc: 'Download everything or refine with your AI marketing team.' },
];

const FAQ_BASE = [
  {
    q: 'Do I need a marketing team to use this?',
    a: `No. ${PRODUCT_NAME} is built for founders and small teams who want strategy and copy without hiring a full agency.`,
  },
  {
    q: 'Is this just ChatGPT with a form?',
    a: 'It connects specialized workflows: brand analysis, SEO crawling, asset generation, version history, and campaign export in one workspace.',
  },
  {
    q: 'Can I use it for GEO / AI search?',
    a: 'Yes. Keyword research, blog drafts, and the SEO Agent are designed for traditional SEO and generative engine visibility.',
  },
];

function getStartedFaq(cloudEnabled?: boolean) {
  return {
    q: 'What do I need to get started?',
    a: cloudEnabled
      ? 'Your website URL and a free account. AI runs in the cloud — no API key required.'
      : 'A website URL and a Google Gemini API key. The app runs in your browser — your data stays in local storage.',
  };
}

export default function LandingPage({
  onGetStarted,
  onOpenWorkspace,
  onSignIn,
  hasWorkspace,
  cloudEnabled,
}: LandingPageProps) {
  const primaryCta = cloudEnabled ? (onSignIn ?? onGetStarted) : onGetStarted;
  const stackUi = showGrowthStackUi();
  const faq = [FAQ_BASE[0], getStartedFaq(cloudEnabled), ...FAQ_BASE.slice(1)];
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-white text-sm md:text-base leading-tight block">
                {PRODUCT_NAME}
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider hidden sm:block">
                {PRODUCT_TAGLINE}
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <button type="button" onClick={() => scrollTo('features')} className="hover:text-white transition cursor-pointer">
              Features
            </button>
            <button type="button" onClick={() => scrollTo('how-it-works')} className="hover:text-white transition cursor-pointer">
              How it works
            </button>
            <button type="button" onClick={() => scrollTo('pricing')} className="hover:text-white transition cursor-pointer">
              Pricing
            </button>
            {stackUi && (
              <Link to="/studio" className="hover:text-white transition">
                Studio hub
              </Link>
            )}
            <button type="button" onClick={() => scrollTo('faq')} className="hover:text-white transition cursor-pointer">
              FAQ
            </button>
          </nav>
          <div className="flex items-center gap-2">
            {hasWorkspace && (
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="hidden sm:inline-flex text-xs font-bold text-slate-300 hover:text-white px-3 py-2 cursor-pointer"
              >
                Open workspace
              </button>
            )}
            {cloudEnabled && (
              <button
                type="button"
                onClick={primaryCta}
                className="hidden sm:inline-flex text-xs font-bold text-slate-300 hover:text-white px-3 py-2 cursor-pointer"
              >
                Sign in
              </button>
            )}
            <button
              type="button"
              onClick={primaryCta}
              className="text-xs md:text-sm font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer flex items-center gap-1.5 transition"
            >
              {cloudEnabled ? 'Open app' : 'Get started'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
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
            className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.08] max-w-4xl mx-auto"
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
            className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Analyze any brand, audit SEO, and generate blogs, social posts, emails, and keyword plans —
            without juggling five different tools.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={primaryCta}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition"
            >
              {cloudEnabled ? 'Sign in to your workspace' : 'Start free — analyze your site'}
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo('pricing')}
              className="w-full sm:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl cursor-pointer transition shadow-lg shadow-violet-900/25"
            >
              View pricing
            </button>
            <button
              type="button"
              onClick={() => scrollTo('how-it-works')}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer transition"
            >
              See how it works
            </button>
          </motion.div>
          <p className="mt-6 text-xs text-slate-500 font-mono">
            {cloudEnabled
              ? 'Cloud workspace · Your brand syncs across devices · No API key needed'
              : 'Self-hosted · Bring your own Gemini API key · No credit card'}
          </p>
        </div>
      </section>

      {/* Proof strip */}
      <section className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Brand analysis', value: '< 2 min' },
            { label: 'SEO page crawl', value: 'Up to 20 pages' },
            { label: 'Content types', value: '5 generators' },
            { label: 'Export', value: 'Campaign ZIP' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl md:text-2xl font-display font-black text-white">{stat.value}</p>
              <p className="text-[11px] text-slate-500 font-mono uppercase mt-1 tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      {!stackUi && (
        <section className="border-b border-emerald-900/30 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{PRODUCT_NAME} plans</p>
                <p className="mt-1 text-sm md:text-base text-slate-300">
                  Free to start · Pro from <span className="text-white font-bold">$49/mo</span> · Team from{' '}
                  <span className="text-white font-bold">$149/mo</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => scrollTo('pricing')}
                className="px-5 py-2.5 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
              >
                Compare plans
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
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

      {/* How it works */}
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

      <CadencePricingSection cloudEnabled={cloudEnabled} onGetStarted={primaryCta} />

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
              onClick={onGetStarted}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer transition"
            >
              Try it on your site
            </button>
          </div>
        </div>
      </section>


      {/* FAQ */}
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

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">
            Ready to run marketing like a pro?
          </h2>
          <p className="mt-4 text-slate-400">
            Open the workspace, paste your URL, and let {PRODUCT_NAME} build the plan.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="mt-8 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer inline-flex items-center gap-2 transition shadow-lg shadow-emerald-900/25"
          >
            Launch {PRODUCT_NAME} workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <MarketingFooter onScrollTo={scrollTo} onGetStarted={onGetStarted} />
    </div>
  );
}
