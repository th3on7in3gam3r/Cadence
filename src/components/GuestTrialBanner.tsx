/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function GuestTrialBanner() {
  const { isGuest, signInWithGoogle } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-emerald-950/60 border-b border-amber-900/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-amber-100/90 flex items-center gap-2 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Guest trial — create a <strong className="text-white">free account</strong> to save this brand and
            unlock content generation &amp; SEO tools.
          </span>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
          >
            Create free account
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-500 hover:text-slate-300 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
