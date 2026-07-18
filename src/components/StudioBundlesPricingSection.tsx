/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Package, Sparkles } from 'lucide-react';
import {
  BUNDLE_CATALOG_ORDER,
  MARKETING_BUNDLES,
  STUDIO_BUNDLE_PRODUCT_DISPLAY_ORDER,
  bundleCheckoutHref,
  bundleProductNamesLine,
  bundleSavings,
  productPills,
  bundlePricingCaption,
  type MarketingBundle,
} from '../lib/bundles';
import CadenceSoloPlansGrid from './pricing/CadenceSoloPlansGrid';
import StudioBundleValueBanner from './studio/StudioBundleValueBanner';
import { PRODUCT_NAME } from '../lib/brand';
import { kerygmaPricingUrl } from '../lib/growthStack';

interface StudioBundlesPricingSectionProps {
  id?: string;
  showSoloPlans?: boolean;
  title?: string;
  subtitle?: string;
  cloudEnabled?: boolean;
  onGetStarted?: () => void;
}

function PricingBundleCard({ bundle }: { bundle: MarketingBundle }) {
  const pricing = bundlePricingCaption(bundle.products.length);
  const savings = bundleSavings(bundle);
  const productNamesLine =
    bundle.id === 'studio'
      ? bundleProductNamesLine(bundle.products, STUDIO_BUNDLE_PRODUCT_DISPLAY_ORDER)
      : null;
  const priceHint =
    bundle.products.length > 1
      ? `One subscription for all ${bundle.products.length} products — not $${bundle.monthlyListPrice} each`
      : null;

  return (
    <div
      id={`pricing-bundle-${bundle.id}`}
      className={`relative flex flex-col p-6 md:p-7 rounded-2xl border ${
        bundle.featured
          ? 'border-violet-500/50 bg-gradient-to-b from-violet-950/40 to-slate-900 shadow-lg shadow-violet-900/20'
          : 'border-slate-800 bg-slate-900'
      }`}
    >
      {bundle.badge && (
        <span className="absolute -top-3 left-6 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-violet-500 text-white rounded-full">
          {bundle.badge}
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-display font-extrabold text-white">{bundle.name}</h3>
          {productNamesLine && (
            <p className="mt-2 text-sm font-semibold text-slate-200 leading-snug">{productNamesLine}</p>
          )}
          <p className="text-sm text-slate-400 mt-1">{bundle.tagline}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-display font-black text-white">${bundle.monthlyListPrice}</p>
          <p className="text-[10px] font-mono text-slate-500">{pricing.priceSuffix}</p>
          {bundle.separateListPrice && bundle.id === 'studio' && (
            <p className="text-[10px] text-slate-500 mt-1 line-through">~${bundle.separateListPrice}</p>
          )}
        </div>
      </div>
      {savings && bundle.id === 'studio' && (
        <p className="text-[11px] text-emerald-400/90 mt-2 leading-snug">
          Save ~${savings.amount}/mo vs buying separately ({savings.percent}% off)
        </p>
      )}
      {priceHint && bundle.id !== 'studio' && (
        <p className="text-[11px] text-emerald-400/90 mt-2 leading-snug">{priceHint}</p>
      )}
      <p className="mt-2 text-[11px] font-mono text-violet-300/80">{productPills(bundle.products)}</p>
      <ul className="mt-5 space-y-2.5 flex-1">
        {bundle.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to={bundleCheckoutHref(bundle.id)}
        className={`mt-6 w-full py-3 rounded-xl text-sm font-bold text-center transition ${
          bundle.featured
            ? 'bg-violet-600 hover:bg-violet-500 text-white'
            : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white'
        }`}
      >
        Subscribe to {bundle.name}
      </Link>
    </div>
  );
}

export default function StudioBundlesPricingSection({
  id = 'pricing',
  showSoloPlans = true,
  title = 'Studio bundles — one bill, multiple products',
  subtitle,
  cloudEnabled,
  onGetStarted,
}: StudioBundlesPricingSectionProps) {
  const ordered = BUNDLE_CATALOG_ORDER.map(
    (id) => MARKETING_BUNDLES.find((b) => b.id === id)!,
  ).filter(Boolean);

  const defaultSubtitle = `Aegis Loop + CitePilot + ${PRODUCT_NAME} + Kerygma Social — $199/mo total for the full Studio Bundle (vs ~$350 separately). Checkout on ${PRODUCT_NAME}; link sister accounts in Settings → Studio after purchase.`;
  const resolvedSubtitle = subtitle ?? defaultSubtitle;

  return (
    <section id={id} className="py-20 md:py-28 border-b border-slate-800 scroll-mt-20 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="inline-flex items-center gap-2 text-xs font-mono text-violet-400 uppercase tracking-wider">
            <Package className="w-3.5 h-3.5" />
            Bible Funland studio pricing
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-white">{title}</h2>
          <p className="mt-4 text-slate-400 text-sm md:text-base leading-relaxed">{resolvedSubtitle}</p>
        </div>

        <StudioBundleValueBanner />
        <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
          {ordered.map((bundle) => (
            <div key={String(bundle.id)}>
              <PricingBundleCard bundle={bundle} />
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 rounded-xl border border-slate-800 bg-slate-900/80 text-center">
          <p className="text-sm text-slate-400">
            Already subscribed on Kerygma or CitePilot?{' '}
            <Link to="/app/settings?tab=studio" className="text-violet-400 font-semibold hover:underline">
              Link the same email in Studio settings
            </Link>{' '}
            so bundle entitlements apply automatically.
          </p>
        </div>

        {showSoloPlans && (
          <div className="mt-20">
            <div className="flex items-center gap-2 justify-center mb-8">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-display font-extrabold text-white">{PRODUCT_NAME} only</h3>
            </div>
            <p className="text-center text-sm text-slate-500 max-w-xl mx-auto mb-8">
              Don&apos;t need the full stack? Start free or upgrade {PRODUCT_NAME} alone — add sister products later.
            </p>
            <CadenceSoloPlansGrid
              cloudEnabled={cloudEnabled}
              onGetStarted={onGetStarted ?? (() => {})}
            />
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-slate-600 font-mono">
          Bundle prices are one monthly total for every product in the bundle — not per app. Final charge at Stripe checkout.{' '}
          <a
            href="https://getcitepilot.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-400 inline-flex items-center gap-1"
          >
            CitePilot pricing <ExternalLink className="w-3 h-3" />
          </a>
          {' · '}
          <a
            href={kerygmaPricingUrl('bundle-pricing')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-400 inline-flex items-center gap-1"
          >
            Kerygma pricing <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>
    </section>
  );
}
