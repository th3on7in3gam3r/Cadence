/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { PRODUCT_NAME } from '../lib/brand';

const SCREENSHOT_SRC = '/landing/cadence-dashboard.webp';

export default function LandingHeroPreview() {
  const [hasScreenshot, setHasScreenshot] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasScreenshot(true);
    img.onerror = () => setHasScreenshot(false);
    img.src = SCREENSHOT_SRC;
  }, []);

  if (hasScreenshot) {
    return (
      <div className="relative w-full max-w-lg mx-auto lg:mx-0">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900 p-2 shadow-2xl shadow-emerald-950/30">
          <img
            src={SCREENSHOT_SRC}
            alt={`${PRODUCT_NAME} marketing dashboard`}
            className="w-full rounded-xl border border-slate-800"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/80 p-8 text-center shadow-xl">
        <p className="text-sm font-display font-bold text-slate-300">Product screenshot</p>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Add <span className="font-mono text-slate-400">public/landing/cadence-dashboard.webp</span> to
          show a real dashboard capture on the homepage.
        </p>
      </div>
    </div>
  );
}
