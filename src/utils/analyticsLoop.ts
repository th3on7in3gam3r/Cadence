/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PublishEvent } from '../types';

const KEY = 'ai_cmo_publish_events';
const BASELINE_KEY = 'ai_cmo_analytics_baseline';

export function loadPublishEvents(): PublishEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordPublishEvent(event: Omit<PublishEvent, 'id' | 'publishedAt'>): PublishEvent[] {
  const entry: PublishEvent = {
    ...event,
    id: crypto.randomUUID(),
    publishedAt: new Date().toISOString(),
  };
  const list = [entry, ...loadPublishEvents()].slice(0, 100);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export interface AnalyticsBaseline {
  capturedAt: string;
  siteUrl: string;
  pages: { url: string; title?: string; clicks: number; position: number; sessions?: number }[];
}

export function loadAnalyticsBaseline(): AnalyticsBaseline | null {
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAnalyticsBaseline(baseline: AnalyticsBaseline): void {
  localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
}
