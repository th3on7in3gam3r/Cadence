/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { ReadinessScoreSnapshot } from '../../utils/readinessScoreHistory';
import { readinessScoreDelta } from '../../utils/readinessScoreHistory';

interface ReadinessTrendProps {
  currentScore: number;
  history: ReadinessScoreSnapshot[];
  compact?: boolean;
}

export default function ReadinessTrend({ currentScore, history, compact }: ReadinessTrendProps) {
  const delta = readinessScoreDelta(history, currentScore);
  const sparklineData = history.slice(-8);

  return (
    <div className={compact ? 'mt-2 space-y-2 w-full' : 'w-full mt-3 space-y-3'}>
      {delta != null && delta !== 0 && (
        <p
          className={`flex items-center justify-center gap-1 text-[10px] font-mono font-semibold ${
            delta > 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta > 0 ? '+' : ''}
          {delta} since last scan
        </p>
      )}
      {delta === 0 && history.length >= 2 && (
        <p className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-500">
          <Minus className="w-3 h-3" />
          No change since last scan
        </p>
      )}

      {!compact && sparklineData.length >= 2 && (
        <div>
          <h4 className="text-[9px] font-mono text-slate-500 uppercase mb-2">Score over time</h4>
          <div className="flex items-end gap-1.5 h-10">
            {sparklineData.map((s, i) => (
              <div key={`${s.date}-${i}`} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                <div
                  className="w-full bg-emerald-500/80 rounded-t min-h-[4px]"
                  style={{ height: `${Math.max(12, s.score)}%` }}
                  title={`${s.score}%`}
                />
                <span className="text-[7px] text-slate-600 font-mono truncate w-full text-center">
                  {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
