import { describe, it, expect } from 'vitest';
import { computePlanProgress } from './planProgress';
import type { CalendarTask, WebsiteAnalysis } from '../types';

const analysis = {
  brandName: 'Test',
  thirtyDayActionPlan: [
    { week: 'Week 1', focus: 'Launch', tasks: ['Task A', 'Task B'], expectedOutcome: 'Reach' },
    { week: 'Week 2', focus: 'Grow', tasks: ['Task C'], expectedOutcome: 'Traffic' },
  ],
} as WebsiteAnalysis;

function task(overrides: Partial<CalendarTask> & Pick<CalendarTask, 'weekLabel' | 'title'>): CalendarTask {
  return {
    id: crypto.randomUUID(),
    focus: 'Focus',
    expectedOutcome: 'Outcome',
    scheduledDate: '2026-01-01',
    dayIndex: 0,
    status: 'pending',
    ...overrides,
  };
}

describe('computePlanProgress', () => {
  it('shows week 1 when first week has pending tasks', () => {
    const tasks = [
      task({ weekLabel: 'Week 1', title: 'Task A' }),
      task({ weekLabel: 'Week 1', title: 'Task B' }),
      task({ weekLabel: 'Week 2', title: 'Task C' }),
    ];
    const progress = computePlanProgress(analysis, tasks);
    expect(progress?.currentWeekNumber).toBe(1);
    expect(progress?.remainingInWeek).toBe(2);
    expect(progress?.focus).toBe('Launch');
  });

  it('advances to week 2 when week 1 is complete', () => {
    const tasks = [
      task({ weekLabel: 'Week 1', title: 'Task A', status: 'done' }),
      task({ weekLabel: 'Week 1', title: 'Task B', status: 'done' }),
      task({ weekLabel: 'Week 2', title: 'Task C' }),
    ];
    const progress = computePlanProgress(analysis, tasks);
    expect(progress?.currentWeekNumber).toBe(2);
    expect(progress?.remainingInWeek).toBe(1);
    expect(progress?.focus).toBe('Grow');
  });

  it('shows last week with zero remaining when all complete', () => {
    const tasks = [
      task({ weekLabel: 'Week 1', title: 'Task A', status: 'done' }),
      task({ weekLabel: 'Week 1', title: 'Task B', status: 'done' }),
      task({ weekLabel: 'Week 2', title: 'Task C', status: 'done' }),
    ];
    const progress = computePlanProgress(analysis, tasks);
    expect(progress?.currentWeekNumber).toBe(2);
    expect(progress?.remainingInWeek).toBe(0);
  });

  it('returns null when plan has no weeks', () => {
    expect(computePlanProgress({ brandName: 'X' } as WebsiteAnalysis, [])).toBeNull();
  });
});
