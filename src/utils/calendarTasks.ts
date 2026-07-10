/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalendarTask, CalendarTaskStatus, MarketingAssetType, WebsiteAnalysis } from '../types';

const KEY = 'ai_cmo_calendar_tasks';

const ASSET_HINTS: { pattern: RegExp; type: MarketingAssetType }[] = [
  { pattern: /blog|article|post|content/i, type: 'blog_post' },
  { pattern: /keyword|seo|search/i, type: 'seo_keywords' },
  { pattern: /social|linkedin|twitter|x\b/i, type: 'social_posts' },
  { pattern: /email|newsletter|sequence/i, type: 'email_sequence' },
  { pattern: /lead|magnet|ebook|download/i, type: 'lead_magnet' },
];

function inferAssetType(taskTitle: string): MarketingAssetType | undefined {
  for (const { pattern, type } of ASSET_HINTS) {
    if (pattern.test(taskTitle)) return type;
  }
  return undefined;
}

export function buildTasksFromPlan(analysis: WebsiteAnalysis, startDate = new Date()): CalendarTask[] {
  const tasks: CalendarTask[] = [];
  let dayOffset = 0;
  for (const week of analysis.thirtyDayActionPlan || []) {
    const weekTasks = week.tasks || [];
    weekTasks.forEach((title, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset + i);
      tasks.push({
        id: crypto.randomUUID(),
        weekLabel: week.week,
        focus: week.focus,
        title,
        expectedOutcome: week.expectedOutcome,
        scheduledDate: date.toISOString().slice(0, 10),
        dayIndex: dayOffset + i,
        status: 'pending',
        linkedAssetType: inferAssetType(title),
      });
    });
    dayOffset += Math.max(weekTasks.length, 7);
  }
  return tasks;
}

export function loadCalendarTasks(): CalendarTask[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCalendarTasks(tasks: CalendarTask[]): void {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

export function ensureCalendarTasks(analysis: WebsiteAnalysis): CalendarTask[] {
  const existing = loadCalendarTasks();
  if (existing.length > 0) return existing;
  const built = buildTasksFromPlan(analysis);
  saveCalendarTasks(built);
  return built;
}

export function updateTaskStatus(id: string, status: CalendarTaskStatus): CalendarTask[] {
  const tasks = loadCalendarTasks().map((t) => (t.id === id ? { ...t, status } : t));
  saveCalendarTasks(tasks);
  return tasks;
}

export function moveTaskToDate(id: string, scheduledDate: string): CalendarTask[] {
  const tasks = loadCalendarTasks().map((t) => (t.id === id ? { ...t, scheduledDate } : t));
  saveCalendarTasks(tasks);
  return tasks;
}

export function linkTaskToAsset(id: string, assetType: MarketingAssetType): CalendarTask[] {
  const tasks = loadCalendarTasks().map((t) => (t.id === id ? { ...t, linkedAssetType: assetType } : t));
  saveCalendarTasks(tasks);
  return tasks;
}

export function resetCalendarForPlan(analysis: WebsiteAnalysis): CalendarTask[] {
  const built = buildTasksFromPlan(analysis);
  saveCalendarTasks(built);
  return built;
}
