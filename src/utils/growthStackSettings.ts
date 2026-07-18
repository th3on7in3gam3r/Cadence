/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SETTINGS_KEY = 'ai_cmo_growth_stack_settings';

export interface GrowthStackSettings {
  citePilotApiKey: string;
  kerygmaApiKey: string;
  aegisApiKey: string;
  postwickApiKey: string;
}

const DEFAULTS: GrowthStackSettings = {
  citePilotApiKey: '',
  kerygmaApiKey: '',
  aegisApiKey: '',
  postwickApiKey: '',
};

export function loadGrowthStackSettings(): GrowthStackSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<GrowthStackSettings & { aegisApiUrl?: string }>;
    return {
      ...DEFAULTS,
      citePilotApiKey: parsed.citePilotApiKey ?? '',
      kerygmaApiKey: parsed.kerygmaApiKey ?? '',
      aegisApiKey: parsed.aegisApiKey ?? '',
      postwickApiKey: parsed.postwickApiKey ?? '',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveGrowthStackSettings(settings: GrowthStackSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function recordCitationScore(domain: string, score: number): void {
  const key = `ai_cmo_citation_history_${domain}`;
  try {
    const raw = localStorage.getItem(key);
    const history: { score: number; at: string }[] = raw ? JSON.parse(raw) : [];
    const last = history[0];
    const now = new Date().toISOString();
    if (!last || last.score !== score) {
      history.unshift({ score, at: now });
      localStorage.setItem(key, JSON.stringify(history.slice(0, 12)));
    }
  } catch {
    localStorage.setItem(key, JSON.stringify([{ score, at: new Date().toISOString() }]));
  }
}

export function loadCitationHistory(domain: string): { score: number; at: string }[] {
  try {
    const raw = localStorage.getItem(`ai_cmo_citation_history_${domain}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
