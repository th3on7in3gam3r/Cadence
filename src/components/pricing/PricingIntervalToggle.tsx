/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { BillingInterval } from '../../lib/pricingDisplay';

interface PricingIntervalToggleProps {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}

export default function PricingIntervalToggle({ value, onChange }: PricingIntervalToggleProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="inline-flex items-center p-1 rounded-full bg-slate-900 border border-slate-800"
        role="group"
        aria-label="Billing interval"
      >
        <button
          type="button"
          onClick={() => onChange('monthly')}
          className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
            value === 'monthly'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange('annual')}
          className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
            value === 'annual'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Annual
        </button>
      </div>
      <p className="text-[11px] font-mono text-emerald-400/90">
        {value === 'annual' ? 'Save 20% with annual billing' : 'Switch to annual — save 20%'}
      </p>
    </div>
  );
}
