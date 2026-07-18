/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';

interface GrowthStackEmptyPreviewProps {
  variant: 'citation' | 'pulse';
  className?: string;
}

export default function GrowthStackEmptyPreview({ variant, className = '' }: GrowthStackEmptyPreviewProps) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden>
      <p className="text-[9px] font-mono text-slate-600 uppercase mb-2">Preview</p>
      <div className="opacity-40 animate-pulse">
        {variant === 'citation' ? <CitationPreview /> : <PulsePreview />}
      </div>
    </div>
  );
}

function CitationPreview() {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-display font-bold text-white">
            72
            <span className="text-sm text-slate-500 font-normal">/100</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">8 of 12 prompts cited</p>
        </div>
        <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
          +4 pts
        </span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {['ChatGPT', 'Perplexity', 'Gemini'].map((name) => (
          <span
            key={name}
            className="h-1.5 w-1.5 rounded-full bg-cyan-500/60"
            title={name}
          />
        ))}
      </div>
    </div>
  );
}

function PulsePreview() {
  const bars = [45, 62, 38, 71, 55];
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-display font-bold text-white">
            1.2k
            <span className="text-sm text-slate-500 font-normal ml-1">visitors</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">3.4k views · 28 conversions</p>
        </div>
      </div>
      <div className="mt-3 flex items-end gap-1 h-8">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-emerald-500/60 rounded-t min-h-[4px]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-600 mt-2">142 events · site example.com</p>
    </div>
  );
}
