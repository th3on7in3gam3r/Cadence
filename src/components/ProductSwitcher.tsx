/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ExternalLink, Grid3X3, Loader2, Layers } from 'lucide-react';
import { isCloudEnabled } from '../lib/cloudConfig';
import {
  fetchStudioIdentity,
  type StudioIdentityResponse,
  type StudioProductStatus,
} from '../lib/studioApi';
import { GROWTH_STACK_PRODUCTS, aiCmoAppUrl, aiCmoStudioHubUrl } from '../lib/growthStack';
import { STUDIO_HUB_PRODUCTS } from '../lib/studioHub';

const PRODUCT_COLORS: Record<string, string> = {
  ai_cmo: 'text-amber-400',
  kerygma: 'text-violet-400',
  citepilot: 'text-cyan-400',
  aegis: 'text-rose-400',
};

function fallbackProducts(): StudioProductStatus[] {
  return [
    {
      id: 'ai_cmo',
      name: GROWTH_STACK_PRODUCTS.aiCmo.name,
      tagline: GROWTH_STACK_PRODUCTS.aiCmo.tagline,
      url: aiCmoAppUrl(),
      authNote: 'Current session',
      linked: true,
      externalId: null,
    },
    {
      id: 'kerygma',
      name: GROWTH_STACK_PRODUCTS.kerygma.name,
      tagline: GROWTH_STACK_PRODUCTS.kerygma.tagline,
      url: GROWTH_STACK_PRODUCTS.kerygma.url,
      authNote: 'Separate Clerk account',
      linked: false,
      externalId: null,
    },
    {
      id: 'citepilot',
      name: GROWTH_STACK_PRODUCTS.citePilot.name,
      tagline: GROWTH_STACK_PRODUCTS.citePilot.tagline,
      url: GROWTH_STACK_PRODUCTS.citePilot.url,
      authNote: 'Separate Neon Auth account',
      linked: false,
      externalId: null,
    },
    {
      id: 'aegis',
      name: GROWTH_STACK_PRODUCTS.aegis.name,
      tagline: GROWTH_STACK_PRODUCTS.aegis.tagline,
      url: GROWTH_STACK_PRODUCTS.aegis.url,
      authNote: 'GitHub OAuth',
      linked: false,
      externalId: null,
    },
  ];
}

export default function ProductSwitcher() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(isCloudEnabled());
  const [identity, setIdentity] = useState<StudioIdentityResponse | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCloudEnabled()) {
      setLoading(false);
      return;
    }
    fetchStudioIdentity()
      .then(setIdentity)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const products = identity?.products || fallbackProducts();
  const linkedCount = products.filter((p) => p.linked).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all cursor-pointer"
        title="Growth stack products"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
        ) : (
          <Grid3X3 className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span className="hidden sm:inline">Stack</span>
        <span className="text-[10px] text-slate-500">{linkedCount}/{products.length}</span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Bible Funland growth stack</p>
          </div>
          <ul className="py-1">
            {products.map((p) => (
              <li key={p.id}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-slate-800/80 transition-colors group"
                  onClick={() => setOpen(false)}
                >
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${p.linked ? 'bg-emerald-500' : 'bg-slate-600'}`}
                    title={p.linked ? 'Linked' : 'Not linked'}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`text-xs font-bold block ${PRODUCT_COLORS[p.id] || 'text-white'}`}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{p.tagline}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5" />
                </a>
              </li>
            ))}
          </ul>
          <div className="px-3 py-2 border-t border-slate-800">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">
              Ministry tools
            </p>
            <ul className="space-y-1">
              {STUDIO_HUB_PRODUCTS.filter((p) => p.category !== 'growth').map((p) => (
                <li key={p.id}>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-1 py-1.5 text-[11px] text-slate-500 hover:text-slate-300"
                    onClick={() => setOpen(false)}
                  >
                    <Layers className="w-3 h-3 text-amber-500/80 shrink-0" />
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/50 space-y-1">
            <Link
              to="/app/studio"
              className="block text-[11px] font-bold text-violet-400 hover:text-violet-300"
              onClick={() => setOpen(false)}
            >
              Open studio dashboard →
            </Link>
            <a
              href={aiCmoStudioHubUrl()}
              className="block text-[10px] text-slate-500 hover:text-slate-400"
              onClick={() => setOpen(false)}
            >
              Public studio hub
            </a>
          </div>
          {isCloudEnabled() && (
            <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/50">
              <p className="text-[10px] text-slate-500">
                Link accounts in Settings → Studio
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
