/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppNotification, NotificationPreferences, SeoScoreSnapshot } from '../types';

const PREFS_KEY = 'ai_cmo_notification_prefs';
const INBOX_KEY = 'ai_cmo_notifications';

export const defaultNotificationPrefs: NotificationPreferences = {
  onAuditComplete: true,
  onScoreDrop: true,
  weeklyDigest: true,
};

export function loadNotificationPrefs(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultNotificationPrefs, ...JSON.parse(raw) } : { ...defaultNotificationPrefs };
  } catch {
    return { ...defaultNotificationPrefs };
  }
}

export function saveNotificationPrefs(prefs: NotificationPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification[] {
  const entry: AppNotification = {
    ...n,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  const list = [entry, ...loadNotifications()].slice(0, 50);
  localStorage.setItem(INBOX_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('notifications_updated'));
  return list;
}

export function markNotificationRead(id: string): AppNotification[] {
  const list = loadNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(INBOX_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('notifications_updated'));
  return list;
}

export function markAllNotificationsRead(): AppNotification[] {
  const list = loadNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(INBOX_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('notifications_updated'));
  return list;
}

export function unreadCount(): number {
  return loadNotifications().filter((n) => !n.read).length;
}

const SCORE_HISTORY_KEY = 'ai_cmo_seo_score_history';

export function loadSeoScoreHistory(): SeoScoreSnapshot[] {
  try {
    const raw = localStorage.getItem(SCORE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendSeoScoreSnapshot(snapshot: Omit<SeoScoreSnapshot, 'date'> & { date?: string }): SeoScoreSnapshot[] {
  const entry: SeoScoreSnapshot = {
    ...snapshot,
    date: snapshot.date || new Date().toISOString(),
  };
  const list = [...loadSeoScoreHistory(), entry].slice(-30);
  localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(list));
  return list;
}

export function checkScoreDrop(
  current: number,
  prefs = loadNotificationPrefs()
): void {
  const history = loadSeoScoreHistory();
  if (!prefs.onScoreDrop || history.length < 2) return;
  const prev = history[history.length - 2];
  if (current < prev.overallScore - 5) {
    addNotification({
      type: 'score_drop',
      title: 'SEO score dropped',
      message: `Overall score fell from ${prev.overallScore}% to ${current}% since your last audit.`,
    });
  }
}
