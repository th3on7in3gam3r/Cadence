/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import type { PlanProgress } from '../../utils/planProgress';

interface PlanWeekProgressProps {
  progress: PlanProgress | null;
  onOpenCalendar?: () => void;
  onScrollToPlan?: () => void;
}

export default function PlanWeekProgress({
  progress,
  onOpenCalendar,
  onScrollToPlan,
}: PlanWeekProgressProps) {
  if (!progress) return null;

  const taskLabel = progress.remainingInWeek === 1 ? 'task' : 'tasks';
  const weekPct =
    progress.totalInWeek > 0
      ? Math.round((progress.completedInWeek / progress.totalInWeek) * 100)
      : 0;

  const handleClick = () => {
    if (onOpenCalendar) {
      onOpenCalendar();
    } else {
      onScrollToPlan?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-left hover:border-emerald-500/30 transition-colors cursor-pointer group"
    >
      <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        Your 4-week plan
      </p>
      <p className="text-xs font-bold text-white mt-1">
        Week {progress.currentWeekNumber} of {progress.totalWeeks}
        {progress.remainingInWeek > 0 ? (
          <>
            {' '}
            — {progress.remainingInWeek} {taskLabel} remaining
          </>
        ) : (
          ' — complete'
        )}
      </p>
      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{progress.focus}</p>
      {progress.totalInWeek > 0 && (
        <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${weekPct}%` }}
          />
        </div>
      )}
      <span className="text-[9px] text-slate-500 group-hover:text-emerald-400 mt-1.5 inline-flex items-center gap-0.5">
        {onOpenCalendar ? 'Open calendar' : 'View full plan'}
        <ChevronRight className="w-3 h-3" />
      </span>
    </button>
  );
}
