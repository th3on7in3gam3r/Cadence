/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { AI_CMO_SOLO_PLANS, bundleCheckoutHref } from '../../lib/bundles';
import { displayPlanPrice, type BillingInterval } from '../../lib/pricingDisplay';
import PricingIntervalToggle from './PricingIntervalToggle';

interface CadenceSoloPlansGridProps {
  cloudEnabled?: boolean;
  onGetStarted: () => void;
  featuredPlanId?: 'pro' | 'team';
}

export default function CadenceSoloPlansGrid({
  cloudEnabled,
  onGetStarted,
  featuredPlanId = 'pro',
}: CadenceSoloPlansGridProps) {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  return (
    <>
      <div className="flex justify-center mb-10">
        <PricingIntervalToggle value={interval} onChange={setInterval} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {AI_CMO_SOLO_PLANS.map((plan) => {
          const isFeatured = plan.id === featuredPlanId;
          const checkoutHref =
            plan.id === 'pro'
              ? bundleCheckoutHref('ai_cmo_pro', interval)
              : plan.id === 'team'
                ? bundleCheckoutHref('ai_cmo_team', interval)
                : null;
          const priceDisplay =
            plan.price > 0 ? displayPlanPrice(plan.price, interval) : null;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col p-6 rounded-2xl border ${
                isFeatured
                  ? 'bg-gradient-to-b from-emerald-950/50 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-900/20'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {isFeatured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-display font-bold text-white">{plan.name}</h3>
              <p className="mt-3 flex items-baseline gap-1">
                {priceDisplay ? (
                  <>
                    <span className="text-4xl font-display font-black text-white">
                      ${priceDisplay.amount}
                    </span>
                    <span className="text-sm text-slate-500">{priceDisplay.suffix}</span>
                  </>
                ) : (
                  <span className="text-4xl font-display font-black text-white">Free</span>
                )}
              </p>
              {priceDisplay?.subline && (
                <p className="mt-1 text-[11px] text-slate-500 font-mono">{priceDisplay.subline}</p>
              )}
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.id === 'free' ? (
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="mt-8 w-full py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white transition cursor-pointer"
                >
                  {cloudEnabled ? 'Create free account' : 'Start free'}
                </button>
              ) : cloudEnabled && checkoutHref ? (
                <Link
                  to={checkoutHref}
                  className={`mt-8 w-full py-3 rounded-xl font-bold text-sm text-center transition ${
                    isFeatured
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white'
                  }`}
                >
                  Upgrade to {plan.name}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="mt-8 w-full py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white transition cursor-pointer"
                >
                  Get started
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
