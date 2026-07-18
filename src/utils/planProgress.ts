/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CalendarTask, WebsiteAnalysis } from '../types';

export interface PlanProgress {
  currentWeekNumber: number;
  totalWeeks: number;
  remainingInWeek: number;
  completedInWeek: number;
  totalInWeek: number;
  weekLabel: string;
  focus: string;
}

export function computePlanProgress(
  analysis: WebsiteAnalysis,
  tasks: CalendarTask[],
): PlanProgress | null {
  const weeks = analysis.thirtyDayActionPlan || [];
  if (weeks.length === 0) return null;

  let currentWeekIdx = weeks.length - 1;

  for (let i = 0; i < weeks.length; i++) {
    const weekTasks = tasks.filter((t) => t.weekLabel === weeks[i].week);
    if (weekTasks.length === 0) {
      currentWeekIdx = i;
      break;
    }
    const allDone = weekTasks.every((t) => t.status === 'done');
    if (!allDone) {
      currentWeekIdx = i;
      break;
    }
  }

  const currentWeek = weeks[currentWeekIdx];
  const weekTasks = tasks.filter((t) => t.weekLabel === currentWeek.week);
  const totalInWeek = weekTasks.length;
  const completedInWeek = weekTasks.filter((t) => t.status === 'done').length;
  const remainingInWeek = weekTasks.filter((t) => t.status !== 'done').length;

  return {
    currentWeekNumber: currentWeekIdx + 1,
    totalWeeks: weeks.length,
    remainingInWeek,
    completedInWeek,
    totalInWeek,
    weekLabel: currentWeek.week,
    focus: currentWeek.focus,
  };
}
