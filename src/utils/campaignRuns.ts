/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CampaignRun,
  GeneratedAsset,
  MarketingAssetType,
  SeoAgentAuditResult,
  SiteCrawlResult,
  WebsiteAnalysis,
  AssetHistoryEntry,
  SeoScoreSnapshot,
} from '../types';
import { loadSeoScoreHistory } from './notifications';

const RUNS_KEY = 'ai_cmo_campaign_runs';

export function loadCampaignRuns(): CampaignRun[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCampaignRuns(runs: CampaignRun[]): void {
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

function readSeoCrawl(): SiteCrawlResult | null {
  try {
    const s = localStorage.getItem('ai_cmo_seo_crawl');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function readSeoAudit(): SeoAgentAuditResult | null {
  try {
    const s = localStorage.getItem('ai_cmo_seo_audit');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function writeSeoToStorage(crawl: SiteCrawlResult | null, audit: SeoAgentAuditResult | null): void {
  if (crawl) localStorage.setItem('ai_cmo_seo_crawl', JSON.stringify(crawl));
  else localStorage.removeItem('ai_cmo_seo_crawl');
  if (audit) localStorage.setItem('ai_cmo_seo_audit', JSON.stringify(audit));
  else localStorage.removeItem('ai_cmo_seo_audit');
}

export function clearSeoStorage(): void {
  localStorage.removeItem('ai_cmo_seo_crawl');
  localStorage.removeItem('ai_cmo_seo_audit');
}

export function buildRunSnapshot(input: {
  brandUrl: string;
  growthGoal: string;
  brandVoice: string;
  customChallenge: string;
  brandAnalysis: WebsiteAnalysis;
  cachedAssets: Partial<Record<MarketingAssetType, GeneratedAsset>>;
  assetHistory: Partial<Record<MarketingAssetType, AssetHistoryEntry[]>>;
}): CampaignRun {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    label: input.brandAnalysis.brandName || input.brandUrl,
    brandUrl: input.brandUrl,
    createdAt: now,
    updatedAt: now,
    growthGoal: input.growthGoal,
    brandVoice: input.brandVoice,
    customChallenge: input.customChallenge,
    brandAnalysis: input.brandAnalysis,
    cachedAssets: input.cachedAssets,
    assetHistory: input.assetHistory,
    seoCrawl: readSeoCrawl(),
    seoAudit: readSeoAudit(),
    seoScoreHistory: loadSeoScoreHistory(),
  };
}

export function addCampaignRun(run: CampaignRun): CampaignRun[] {
  const runs = loadCampaignRuns();
  const next = [run, ...runs].slice(0, 25);
  saveCampaignRuns(next);
  return next;
}

export function deleteCampaignRun(id: string): CampaignRun[] {
  const next = loadCampaignRuns().filter((r) => r.id !== id);
  saveCampaignRuns(next);
  return next;
}

export function applyCampaignRun(run: CampaignRun): void {
  localStorage.setItem('ai_cmo_brand_url', run.brandUrl);
  localStorage.setItem('ai_cmo_growth_goal', run.growthGoal);
  localStorage.setItem('ai_cmo_brand_voice', run.brandVoice);
  localStorage.setItem('ai_cmo_custom_challenge', run.customChallenge);
  localStorage.setItem('ai_cmo_brand_analysis', JSON.stringify(run.brandAnalysis));
  localStorage.setItem('ai_cmo_cached_assets', JSON.stringify(run.cachedAssets));
  localStorage.setItem('ai_cmo_asset_history', JSON.stringify(run.assetHistory));
  writeSeoToStorage(run.seoCrawl ?? null, run.seoAudit ?? null);
}
