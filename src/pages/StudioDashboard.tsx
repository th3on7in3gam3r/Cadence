/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Grid3X3,
  Layers,
  LayoutGrid,
  Link2,
  Loader2,
  Search,
  Share2,
  Shield,
  Sparkles,
  Video,
  Globe2,
} from 'lucide-react';
import { isCloudEnabled } from '../lib/cloudConfig';
import { fetchBillingStatus, type BillingStatus } from '../lib/billingApi';
import { aiCmoBillingPath, aiCmoStudioHubUrl } from '../lib/growthStack';
import { MARKETING_BUNDLES, bundleCheckoutHref } from '../lib/bundles';
import {
  PERSONA_OPTIONS,
  STUDIO_HUB_PRODUCTS,
  productById,
  type PersonaId,
} from '../lib/studioHub';
import {
  fetchStudioIdentity,
  type StudioIdentityResponse,
  type StudioProductId,
  type StudioProductStatus,
} from '../lib/studioApi';

const GROWTH_ICONS: Record<string, React.ReactNode> = {
  ai_cmo: <Sparkles className="w-4 h-4" />,
  citepilot: <Search className="w-4 h-4" />,
  kerygma: <Share2 className="w-4 h-4" />,
  postwick: <Globe2 className="w-4 h-4" />,
  aegis: <Shield className="w-4 h-4" />,
};

const CHURCH_ICONS: Record<string, React.ReactNode> = {
  vesper: <Video className="w-4 h-4" />,
  rhemanote: <BookOpen className="w-4 h-4" />,
  pulpit: <LayoutGrid className="w-4 h-4" />,
};

interface StudioDashboardProps {
  onBackToDashboard: () => void;
}

export default function StudioDashboard({ onBackToDashboard }: StudioDashboardProps) {
  const cloud = isCloudEnabled();
  const [identity, setIdentity] = useState<StudioIdentityResponse | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(cloud);
  const [persona, setPersona] = useState<PersonaId | null>(null);

  useEffect(() => {
    if (!cloud) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetchStudioIdentity().catch(() => null),
      fetchBillingStatus().catch(() => null),
    ])
      .then(([id, bill]) => {
        setIdentity(id);
        setBilling(bill);
      })
      .finally(() => setLoading(false));
  }, [cloud]);

  const linkedProducts = identity?.products.filter((p) => p.linked) ?? [];
  const activeBundles = billing?.activeBundles ?? billing?.studioSubscriptions ?? [];
  const recommendation = persona ? PERSONA_OPTIONS.find((p) => p.id === persona) : null;
  const primary = recommendation ? productById(recommendation.primaryProduct) : null;

  const growthStack = STUDIO_HUB_PRODUCTS.filter((p) => p.category === 'growth');
  const churchStack = STUDIO_HUB_PRODUCTS.filter((p) => p.category !== 'growth');

  const identityMap = new Map<StudioProductId, StudioProductStatus>(
    identity?.products.map((p) => [p.id, p]) ?? [],
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-mono text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
            <Grid3X3 className="w-3.5 h-3.5" />
            Bible Funland Studio
          </p>
          <h1 className="mt-2 text-2xl md:text-3xl font-display font-extrabold text-white">
            Your growth stack
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Connected products, bundle billing, and quick links to sister apps — all from one hub.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
          >
            ← Dashboard
          </button>
          <a
            href={aiCmoStudioHubUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-xs font-bold border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 inline-flex items-center gap-1"
          >
            Public hub
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          {/* Status strip */}
          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[10px] font-mono text-slate-500 uppercase">Linked products</p>
              <p className="mt-1 text-2xl font-display font-black text-white">
                {linkedProducts.length}
                <span className="text-sm font-normal text-slate-500"> / 4</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[10px] font-mono text-slate-500 uppercase">Active bundles</p>
              <p className="mt-1 text-2xl font-display font-black text-white">
                {activeBundles.filter((b) => b.status === 'active' || b.status === 'trialing').length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[10px] font-mono text-slate-500 uppercase">Studio email</p>
              <p className="mt-1 text-sm font-mono text-slate-300 truncate">
                {identity?.email || 'Sign in with cloud mode'}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mb-10">
            <Link
              to="/app/settings?tab=studio"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect products
            </Link>
            <Link
              to="/app/settings?tab=billing"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold rounded-lg text-slate-200"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Manage billing
            </Link>
          </div>

          {/* Growth stack products */}
          <section className="mb-10">
            <h2 className="text-sm font-mono text-slate-500 uppercase tracking-wider mb-4">
              Growth stack
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {growthStack.map((product) => {
                const status = identityMap.get(product.id as StudioProductId);
                const isPostwick = product.id === 'postwick';
                const linked = isPostwick
                  ? null
                  : (status?.linked ?? product.id === 'ai_cmo');
                const badgeLabel = isPostwick
                  ? 'Public gallery'
                  : linked
                    ? 'Linked'
                    : 'Not linked';
                const badgeClass = isPostwick
                  ? 'bg-sky-950 text-sky-400'
                  : linked
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-slate-800 text-slate-500';
                return (
                  <div
                    key={product.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3"
                  >
                    <div className={`mt-0.5 ${isPostwick ? 'text-sky-400' : linked ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {GROWTH_ICONS[product.id]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{product.name}</h3>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${badgeClass}`}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{product.tagline}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={product.href}
                          target={product.id === 'ai_cmo' ? undefined : '_blank'}
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-slate-400 hover:text-white"
                        >
                          Open →
                        </a>
                        {product.bundleId && (
                          <Link
                            to={bundleCheckoutHref(product.bundleId)}
                            className="text-[11px] font-bold text-violet-400 hover:underline"
                          >
                            Bundle pricing
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Active bundles */}
          {activeBundles.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-mono text-slate-500 uppercase tracking-wider mb-4">
                Your subscriptions
              </h2>
              <div className="space-y-2">
                {activeBundles.map((sub) => {
                  const bundle = MARKETING_BUNDLES.find((b) => b.id === sub.bundle_id);
                  return (
                    <div
                      key={sub.stripe_subscription_id}
                      className="p-4 rounded-xl bg-slate-900 border border-violet-500/20 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">
                          {bundle?.name ?? sub.bundle_id}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{sub.status}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Persona picker */}
          <section className="mb-10 p-5 rounded-2xl border border-slate-800 bg-slate-900/50">
            <h2 className="text-sm font-bold text-white">Not sure what to use next?</h2>
            <p className="text-xs text-slate-500 mt-1">Pick a persona for a recommended starting product.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PERSONA_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPersona(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    persona === opt.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {recommendation && primary && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-xs text-amber-400 font-mono uppercase">Recommended</p>
                <p className="mt-1 text-sm font-bold text-white">{primary.name}</p>
                <p className="text-xs text-slate-500">{primary.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={primary.href}
                    target={primary.id === 'ai_cmo' ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400"
                  >
                    Open {primary.name}
                    <ArrowRight className="w-3 h-3" />
                  </a>
                  {recommendation.bundleId && (
                    <Link
                      to={aiCmoBillingPath({ bundle: recommendation.bundleId })}
                      className="text-xs font-bold text-violet-400 hover:underline"
                    >
                      View bundle
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Church & ministry */}
          <section>
            <h2 className="text-sm font-mono text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              Church & ministry tools
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {churchStack.map((product) => (
                <a
                  key={product.id}
                  href={product.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-colors group"
                >
                  <div className="text-amber-400 mb-2">
                    {CHURCH_ICONS[product.id] ?? <LayoutGrid className="w-4 h-4" />}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-100">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{product.tagline}</p>
                </a>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
