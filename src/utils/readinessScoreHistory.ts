/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeBrandUrl } from './websiteUrl';

const HISTORY_KEY = 'ai_cmo_readiness_score_history';
const MAX_PER_BRAND = 20;

export interface ReadinessScoreSnapshot {
  date: string;
  score: number;
  grade: string;
  brandUrl: string;
}

function brandKey(brandUrl: string): string {
  return normalizeBrandUrl(brandUrl).toLowerCase();
}

function loadAllSnapshots(): ReadinessScoreSnapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllSnapshots(snapshots: ReadinessScoreSnapshot[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(snapshots));
}

export function loadReadinessScoreHistory(brandUrl: string): ReadinessScoreSnapshot[] {
  if (!brandUrl) return [];
  const key = brandKey(brandUrl);
  return loadAllSnapshots()
    .filter((s) => brandKey(s.brandUrl) === key)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function appendReadinessScoreSnapshot(
  brandUrl: string,
  score: number,
  grade: string,
): ReadinessScoreSnapshot[] {
  const normalized = normalizeBrandUrl(brandUrl);
  if (!normalized) return [];

  const entry: ReadinessScoreSnapshot = {
    date: new Date().toISOString(),
    score,
    grade,
    brandUrl: normalized,
  };

  const key = brandKey(normalized);
  const others = loadAllSnapshots().filter((s) => brandKey(s.brandUrl) !== key);
  const forBrand = [...loadReadinessScoreHistory(normalized), entry].slice(-MAX_PER_BRAND);
  saveAllSnapshots([...others, ...forBrand]);
  return forBrand;
}

/** Current score minus the prior audit snapshot; null if fewer than 2 data points. */
export function readinessScoreDelta(
  history: ReadinessScoreSnapshot[],
  currentScore: number,
): number | null {
  if (history.length < 2) return null;
  return currentScore - history[history.length - 2].score;
}
