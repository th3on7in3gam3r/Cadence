/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import CadenceSoloPlansGrid from './pricing/CadenceSoloPlansGrid';
import { PRODUCT_NAME } from '../lib/brand';

interface CadencePricingSectionProps {
  cloudEnabled?: boolean;
  onGetStarted: () => void;
}

export default function CadencePricingSection({ cloudEnabled, onGetStarted }: CadencePricingSectionProps) {
  return (
    <section id="pricing" className="py-20 md:py-28 border-b border-slate-800 bg-slate-900/30 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Pricing</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-display font-extrabold text-white">
            Start free. Scale when you ship.
          </h2>
          <p className="mt-4 text-slate-400">
            {PRODUCT_NAME} plans are built for solo founders and growing teams — no studio bundle required.
          </p>
        </div>

        <CadenceSoloPlansGrid cloudEnabled={cloudEnabled} onGetStarted={onGetStarted} />
      </div>
    </section>
  );
}
