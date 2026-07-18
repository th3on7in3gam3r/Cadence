import { describe, it, expect, beforeEach } from 'vitest';
import { buildTasksFromPlan, inferAssetTypeFromText, loadCalendarTasks, saveCalendarTasks } from './calendarTasks';
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

  it('infers asset types from text', () => {
    expect(inferAssetTypeFromText('Keyword research for SEO')).toBe('seo_keywords');
    expect(inferAssetTypeFromText('Share on LinkedIn daily')).toBe('social_posts');
    expect(inferAssetTypeFromText('Expand into new markets')).toBeUndefined();
  });
});
