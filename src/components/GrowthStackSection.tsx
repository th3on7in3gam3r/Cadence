/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, Layers, Shield, Sparkles, Share2, Search } from 'lucide-react';
import {
  BIBLEFUNLAND_STUDIOS_URL,
  GROWTH_STACK_PRODUCTS,
  aiCmoAppUrl,
  aiCmoStudioHubUrl,
} from '../lib/growthStack';
import { PRODUCT_NAME } from '../lib/brand';

const SISTER_PRODUCTS = [
  {
    key: 'citePilot',
    icon: <Search className="w-5 h-5" />,
    color: 'text-cyan-400',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    href: GROWTH_STACK_PRODUCTS.citePilot.url,
  },
  {
    key: 'kerygma',
    icon: <Share2 className="w-5 h-5" />,
    color: 'text-amber-400',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    href: GROWTH_STACK_PRODUCTS.kerygma.url,
  },
  {
    key: 'aegis',
    icon: <Shield className="w-5 h-5" />,
    color: 'text-violet-400',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    href: GROWTH_STACK_PRODUCTS.aegis.url,
  },
] as const;

export default function GrowthStackSection() {
  return (
    <section id="growth-stack" className="py-20 md:py-28 border-b border-slate-800 scroll-mt-16 bg-slate-950/50">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Part of the growth stack
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-white">
            Strategy, citations, social, and security — connected
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            {PRODUCT_NAME} is one product in the{' '}
            <a
              href={BIBLEFUNLAND_STUDIOS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30"
            >
              Bible Funland Studios
            </a>{' '}
            family. Use each tool where it fits — same brand URL, no forced bundle.{' '}
            <a
              href={aiCmoStudioHubUrl()}
              className="text-violet-400 hover:text-violet-300 underline decoration-violet-500/30"
            >
              Open studio hub
            </a>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg shadow-emerald-900/10">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-wider">You are here</span>
            </div>
            <h3 className="font-display font-bold text-white">{GROWTH_STACK_PRODUCTS.aiCmo.name}</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {GROWTH_STACK_PRODUCTS.aiCmo.tagline}
            </p>
            <a
              href={aiCmoAppUrl()}
              className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              Open workspace →
            </a>
          </div>

          {SISTER_PRODUCTS.map((item) => {
            const product = GROWTH_STACK_PRODUCTS[item.key];
            return (
              <a
                key={item.key}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-5 rounded-2xl bg-slate-900 border transition-colors group ${item.border}`}
              >
                <div className={`flex items-center gap-2 mb-2 ${item.color}`}>
                  {item.icon}
                  <span className="text-xs font-mono uppercase tracking-wider">Sister product</span>
                </div>
                <h3 className="font-display font-bold text-white group-hover:text-slate-100">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{product.tagline}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-slate-500 group-hover:text-slate-300">
                  Learn more
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
