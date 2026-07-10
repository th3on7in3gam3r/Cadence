/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useProgress } from '../contexts/ProgressContext';

export default function GlobalProgressBar() {
  const { progress } = useProgress();
  if (!progress.active) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-slate-900/95 border-b border-slate-800 backdrop-blur"
      role="progressbar"
      aria-valuenow={progress.percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={progress.label}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-slate-400 shrink-0 max-w-[50%] truncate">
          {progress.label} · {progress.percent}%
        </span>
      </div>
    </div>
  );
}
