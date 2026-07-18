/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GrowthStackEmptyPreviewProps {
  variant: 'citation' | 'pulse';
  className?: string;
}

export default function GrowthStackEmptyPreview({ variant, className = '' }: GrowthStackEmptyPreviewProps) {
  return (
    <div
      className={`rounded-lg border border-dashed border-slate-800 bg-slate-950/50 px-4 py-3 ${className}`}
      aria-hidden
    >
      <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Not connected yet</p>
      <p className="text-xs text-slate-400 leading-relaxed">
        {variant === 'citation'
          ? 'Run a CitePilot audit on your domain to see citation score and prompt coverage here.'
          : 'Enable Pulse on this brand to see visitors, views, and conversions here.'}
      </p>
    </div>
  );
}
