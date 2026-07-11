/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Loader2, ExternalLink, Package, Sparkles } from 'lucide-react';
import {
  fetchBillingStatus,
  fetchBundleCatalog,
  startCheckout,
  openBillingPortal,
  type BillingStatus,
} from '../../lib/billingApi';
import { isCloudEnabled } from '../../lib/cloudConfig';
import type { BundleCatalogItem, BundleId } from '../../lib/bundles';
import { BUNDLE_CATALOG_ORDER, PRODUCT_LABELS, bundlePricingCaption } from '../../lib/bundles';
import { PRODUCT_NAME } from '../../lib/brand';

const AI_CMO_FEATURES = {
  free: ['1 brand workspace', '3 SEO audits / month', 'Quick crawl (8 pages)', 'Dashboard & content studio'],
  pro: ['Unlimited brands', 'Unlimited SEO audits', 'Deep crawl (100 pages/job)', '500 deep-crawl credits/mo', 'GSC & GA4 integrations', 'White-label PDF reports'],
  team: ['Everything in Pro', 'Deep crawl (500 pages/job)', '2,000 deep-crawl credits/mo', 'Up to 10 seats', 'Team invites & roles', 'Approval workflow'],
};

function productPills(products: string[]) {
  return products.map((p) => PRODUCT_LABELS[p as keyof typeof PRODUCT_LABELS] || p).join(' · ');
}

export default function BillingTab({ highlightBundle }: { highlightBundle?: string }) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [catalog, setCatalog] = useState<BundleCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchBillingStatus(), fetchBundleCatalog()])
      .then(([billing, cat]) => {
        setStatus(billing);
        setCatalog(cat.bundles.length ? cat.bundles : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!highlightBundle || loading) return;
    const el = document.getElementById(`bundle-card-${highlightBundle}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightBundle, loading]);

  const handleCheckout = async (input: { bundle?: BundleId; plan?: 'pro' | 'team' }) => {
    if (!isCloudEnabled()) {
      setError('Sign in with cloud mode to subscribe via Stripe.');
      return;
    }
    const key = input.bundle || input.plan || 'checkout';
    setBusy(key);
    setError(null);
    try {
      const url = await startCheckout(input);
      if (url) window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setBusy(null);
    }
  };

  const handlePortal = async () => {
    setBusy('portal');
    try {
      const url = await openBillingPortal();
      if (url) window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Portal failed');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading billing…
      </div>
    );
  }

  const current = status?.plan || 'free';
  const activeBundleIds = new Set((status?.activeBundles || []).map((b) => b.bundle_id));
  const orderedBundles = BUNDLE_CATALOG_ORDER
    .map((id) => catalog.find((b) => b.id === id))
    .filter(Boolean) as BundleCatalogItem[];

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300">{error}</div>
      )}

      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
        <div>
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            {PRODUCT_NAME} plan: <span className="text-amber-400 capitalize">{current}</span>
          </p>
          {status && (
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              SEO audits this month: {status.usage.seoAuditsThisMonth}
              {status.limits.seoAuditsPerMonth < 999 && ` / ${status.limits.seoAuditsPerMonth}`}
            </p>
          )}
          {(status?.activeBundles?.length ?? 0) > 0 && (
            <p className="text-[11px] text-emerald-400 mt-1">
              Active bundles: {status!.activeBundles!.map((b) => b.bundle_id).join(', ')}
            </p>
          )}
        </div>
        {isCloudEnabled() && status?.subscription?.stripe_customer_id && (
          <button
            type="button"
            onClick={handlePortal}
            disabled={!!busy}
            className="text-xs font-bold px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white cursor-pointer flex items-center gap-1"
          >
            {busy === 'portal' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            Manage all subscriptions
          </button>
        )}
      </div>

      {/* Studio bundles */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-display font-extrabold text-white">Studio bundles</h3>
        </div>
        <p className="text-[11px] text-slate-500 max-w-2xl">
          One Stripe customer, multiple products. Bundle prices are a <strong className="text-slate-400">single monthly total</strong> for every app listed — not per product.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {orderedBundles.map((bundle) => {
            const isActive = activeBundleIds.has(bundle.id);
            const pricing = bundlePricingCaption(bundle.products.length);
            const priceHint =
              bundle.products.length > 1
                ? `One subscription for all ${bundle.products.length} products — not $${bundle.monthlyListPrice} each`
                : null;
            return (
              <div
                key={bundle.id}
                id={`bundle-card-${bundle.id}`}
                className={`p-5 rounded-2xl border flex flex-col ${
                  bundle.featured
                    ? 'border-violet-500/40 bg-violet-950/10'
                    : 'border-slate-800 bg-slate-900'
                } ${
                  highlightBundle === bundle.id ? 'ring-2 ring-violet-400/60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-display font-extrabold text-white">{bundle.name}</h4>
                  {bundle.featured && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{bundle.tagline}</p>
                <p className="text-[10px] text-slate-600 mt-1 font-mono">{productPills(bundle.products)}</p>
                <p className="text-2xl font-bold text-white mt-3">
                  ${bundle.monthlyListPrice}
                  <span className="text-xs text-slate-500 font-normal">{pricing.priceSuffix}</span>
                </p>
                {priceHint && (
                  <p className="text-[10px] text-emerald-400/90 mt-1 leading-snug">{priceHint}</p>
                )}
                <button
                  type="button"
                  disabled={!bundle.configured || isActive || !!busy}
                  onClick={() => handleCheckout({ bundle: bundle.id })}
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 cursor-default'
                      : bundle.configured
                        ? 'bg-violet-600 hover:bg-violet-500 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {busy === bundle.id
                    ? 'Redirecting…'
                    : isActive
                      ? 'Active bundle'
                      : bundle.configured
                        ? 'Subscribe'
                        : 'Configure Stripe price'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI-CMO only */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-display font-extrabold text-white">{PRODUCT_NAME} only</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {(['free', 'pro', 'team'] as const).map((plan) => {
            const isCurrent = current === plan;
            const price = plan === 'free' ? 0 : plan === 'pro' ? 49 : 149;
            return (
              <div
                key={plan}
                className={`p-5 rounded-2xl border flex flex-col ${
                  isCurrent ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800 bg-slate-900'
                }`}
              >
                <h3 className="text-sm font-display font-extrabold text-white capitalize">{plan}</h3>
                <p className="text-2xl font-bold text-white mt-2">
                  {price === 0 ? 'Free' : `$${price}`}
                  {price > 0 && <span className="text-xs text-slate-500 font-normal">/mo</span>}
                </p>
                <ul className="mt-4 space-y-2 flex-1">
                  {AI_CMO_FEATURES[plan].map((f) => (
                    <li key={f} className="text-[11px] text-slate-400 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan !== 'free' && (
                  <button
                    type="button"
                    disabled={isCurrent || !!busy}
                    onClick={() => handleCheckout({ plan })}
                    className={`mt-4 w-full py-2 rounded-lg text-xs font-bold cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-500 cursor-default'
                        : 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                    }`}
                  >
                    {busy === plan ? 'Redirecting…' : isCurrent ? 'Current plan' : `Upgrade to ${plan}`}
                  </button>
                )}
                {plan === 'free' && isCurrent && (
                  <span className="mt-4 text-center text-[10px] font-mono text-emerald-400">Active</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {(status?.stripeSubscriptions?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-mono text-slate-500 uppercase">All Stripe subscriptions</h3>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-950 text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2 font-mono">Bundle</th>
                  <th className="text-left px-3 py-2 font-mono">Status</th>
                  <th className="text-left px-3 py-2 font-mono hidden sm:table-cell">Renews</th>
                </tr>
              </thead>
              <tbody>
                {status!.stripeSubscriptions!.map((sub) => (
                  <tr key={sub.id} className="border-t border-slate-800 text-slate-300">
                    <td className="px-3 py-2">{sub.bundleId || '—'}</td>
                    <td className="px-3 py-2 capitalize">{sub.status}</td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!isCloudEnabled() && (
        <p className="text-[11px] text-slate-500">
          Local mode: plan limits apply in this browser. Connect Supabase + Stripe for cloud billing.
        </p>
      )}
    </div>
  );
}
