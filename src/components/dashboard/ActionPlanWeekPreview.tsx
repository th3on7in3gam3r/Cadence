/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { WeeklyPlanItem } from '../../types';

interface ActionPlanWeekPreviewProps {
  week: WeeklyPlanItem;
  weekIndex: number;
  compact?: boolean;
}

export default function ActionPlanWeekPreview({ week, weekIndex, compact }: ActionPlanWeekPreviewProps) {
  return (
    <div
      className={`bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden ${
        compact ? 'p-4' : 'p-4'
      }`}
    >
      <span className="absolute top-2 right-3 text-5xl font-black text-slate-800/30 select-none">
        {weekIndex + 1}
      </span>
      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">This week</span>
          <span className="text-[10px] font-mono text-slate-500">{week.week}</span>
        </div>
        <h4 className="text-sm font-bold text-white">{week.focus}</h4>
        <ul className="space-y-1.5 mt-2">
          {(week.tasks || []).map((task, tIdx) => (
            <li key={tIdx} className="text-xs text-slate-300 flex gap-2">
              <span className="text-slate-500 shrink-0">{tIdx + 1}.</span>
              {task}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-emerald-400 pt-2 border-t border-slate-800 mt-2">
          <span className="text-slate-500 block text-[9px] uppercase mb-0.5">Expected result</span>
          {week.expectedOutcome}
        </p>
        {compact && (
          <p className="text-[10px] text-slate-500 pt-1">Tap above to see all 4 weeks</p>
        )}
      </div>
    </div>
  );
}
