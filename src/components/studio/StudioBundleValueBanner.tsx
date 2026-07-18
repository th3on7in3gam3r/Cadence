/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  STUDIO_BUNDLE,
  STUDIO_BUNDLE_PRODUCT_DISPLAY_ORDER,
  bundleCheckoutHref,
  bundleProductNamesLine,
  bundleSavings,
} from '../../lib/bundles';

export default function StudioBundleValueBanner() {
  const productLine = bundleProductNamesLine(
    STUDIO_BUNDLE.products,
    STUDIO_BUNDLE_PRODUCT_DISPLAY_ORDER,
  );
  const savings = bundleSavings(STUDIO_BUNDLE);

  return (
    <div className="mb-10 p-6 md:p-8 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/25 via-slate-900 to-slate-950">
      <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
        Four products, one subscription, one Stripe checkout
      </p>
      <p className="mt-3 text-base md:text-lg font-display font-bold text-white leading-snug">
        {productLine}
      </p>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <p className="text-3xl md:text-4xl font-display font-black text-white">
          ${STUDIO_BUNDLE.monthlyListPrice}
          <span className="text-sm font-mono font-normal text-slate-500">/mo total</span>
        </p>
        {STUDIO_BUNDLE.separateListPrice && (
          <p className="text-sm text-slate-500">
            vs{' '}
            <span className="line-through decoration-slate-600">
              ~${STUDIO_BUNDLE.separateListPrice}
            </span>{' '}
            if bought separately
          </p>
        )}
        {savings && (
          <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
            Save ~${savings.amount}/mo ({savings.percent}%)
          </span>
        )}
      </div>
      <Link
        to={bundleCheckoutHref('studio')}
        className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition"
      >
        Subscribe to Studio Bundle
      </Link>
    </div>
  );
}
