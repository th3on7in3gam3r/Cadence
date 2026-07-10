import { describe, it, expect, beforeEach } from 'vitest';
import { buildTasksFromPlan, loadCalendarTasks, saveCalendarTasks } from './calendarTasks';
import type { WebsiteAnalysis } from '../types';

const mockAnalysis = {
  brandName: 'Test',
  thirtyDayActionPlan: [
    { week: 'Week 1', focus: 'SEO', tasks: ['Write blog', 'Keyword research'], expectedOutcome: 'Traffic' },
  ],
} as WebsiteAnalysis;

describe('calendarTasks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('builds tasks from 30-day plan', () => {
    const tasks = buildTasksFromPlan(mockAnalysis);
    expect(tasks.length).toBe(2);
    expect(tasks[0].linkedAssetType).toBe('blog_post');
  });

  it('persists tasks to localStorage', () => {
    const tasks = buildTasksFromPlan(mockAnalysis);
    saveCalendarTasks(tasks);
    expect(loadCalendarTasks().length).toBe(2);
  });
});
