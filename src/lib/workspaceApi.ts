/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './api';
import { sanitizeWorkspacePayload } from './workspaceSanitize';
import { WebsiteAnalysis, GeneratedAsset, MarketingAssetType, AssetHistoryEntry, CampaignRun, SiteCrawlResult, SeoAgentAuditResult } from '../types';

export interface WorkspacePayload {
  brandUrl: string;
  growthGoal: string;
  brandVoice: string;
  customChallenge: string;
  brandAnalysis: WebsiteAnalysis | null;
  cachedAssets: Partial<Record<MarketingAssetType, GeneratedAsset>>;
  assetHistory: Partial<Record<MarketingAssetType, AssetHistoryEntry[]>>;
  activeView?: string;
  activeAssetType?: MarketingAssetType | null;
  campaignRuns?: CampaignRun[];
  seoCrawl?: SiteCrawlResult | null;
  seoAudit?: SeoAgentAuditResult | null;
}

export function hydrateLocalFromPayload(payload: WorkspacePayload): void {
  if (payload.brandUrl) localStorage.setItem('ai_cmo_brand_url', payload.brandUrl);
  if (payload.growthGoal) localStorage.setItem('ai_cmo_growth_goal', payload.growthGoal);
  if (payload.brandVoice) localStorage.setItem('ai_cmo_brand_voice', payload.brandVoice);
  localStorage.setItem('ai_cmo_custom_challenge', payload.customChallenge || '');
  if (payload.brandAnalysis) {
    localStorage.setItem('ai_cmo_brand_analysis', JSON.stringify(payload.brandAnalysis));
  } else {
    localStorage.removeItem('ai_cmo_brand_analysis');
  }
  localStorage.setItem('ai_cmo_cached_assets', JSON.stringify(payload.cachedAssets || {}));
  localStorage.setItem('ai_cmo_asset_history', JSON.stringify(payload.assetHistory || {}));
  if (payload.activeView) localStorage.setItem('ai_cmo_active_view', payload.activeView);
  if (payload.seoCrawl) localStorage.setItem('ai_cmo_seo_crawl', JSON.stringify(payload.seoCrawl));
  if (payload.seoAudit) localStorage.setItem('ai_cmo_seo_audit', JSON.stringify(payload.seoAudit));
  if (payload.campaignRuns) localStorage.setItem('ai_cmo_campaign_runs', JSON.stringify(payload.campaignRuns));
}

export function buildEmptyWorkspacePayload(brandUrl = ''): WorkspacePayload {
  return {
    brandUrl,
    growthGoal: '',
    brandVoice: 'Inferred from website content',
    customChallenge: '',
    brandAnalysis: null,
    cachedAssets: {},
    assetHistory: {},
    activeView: 'onboarding',
    activeAssetType: null,
    campaignRuns: [],
    seoCrawl: null,
    seoAudit: null,
  };
}

export function buildPayloadFromLocal(): WorkspacePayload {
  let brandAnalysis = null;
  try {
    const s = localStorage.getItem('ai_cmo_brand_analysis');
    brandAnalysis = s ? JSON.parse(s) : null;
  } catch { /* ignore */ }
  return {
    brandUrl: localStorage.getItem('ai_cmo_brand_url') || '',
    growthGoal: localStorage.getItem('ai_cmo_growth_goal') || '',
    brandVoice: localStorage.getItem('ai_cmo_brand_voice') || '',
    customChallenge: localStorage.getItem('ai_cmo_custom_challenge') || '',
    brandAnalysis,
    cachedAssets: JSON.parse(localStorage.getItem('ai_cmo_cached_assets') || '{}'),
    assetHistory: JSON.parse(localStorage.getItem('ai_cmo_asset_history') || '{}'),
    activeView: localStorage.getItem('ai_cmo_active_view') || 'onboarding',
    activeAssetType: localStorage.getItem('ai_cmo_active_asset_type') as MarketingAssetType | null,
    campaignRuns: JSON.parse(localStorage.getItem('ai_cmo_campaign_runs') || '[]'),
    seoCrawl: JSON.parse(localStorage.getItem('ai_cmo_seo_crawl') || 'null'),
    seoAudit: JSON.parse(localStorage.getItem('ai_cmo_seo_audit') || 'null'),
  };
}

/** Merge cloud, local storage, and live overrides — never drop asset types on save. */
export function mergeWorkspacePayload(
  ...layers: Array<Partial<WorkspacePayload> | null | undefined>
): WorkspacePayload {
  const base = buildPayloadFromLocal();
  const merged: WorkspacePayload = { ...base };

  for (const layer of layers) {
    if (!layer) continue;
    if (layer.brandUrl !== undefined) merged.brandUrl = layer.brandUrl;
    if (layer.growthGoal !== undefined) merged.growthGoal = layer.growthGoal;
    if (layer.brandVoice !== undefined) merged.brandVoice = layer.brandVoice;
    if (layer.customChallenge !== undefined) merged.customChallenge = layer.customChallenge;
    if (layer.brandAnalysis !== undefined) merged.brandAnalysis = layer.brandAnalysis;
    if (layer.activeView !== undefined) merged.activeView = layer.activeView;
    if (layer.activeAssetType !== undefined) merged.activeAssetType = layer.activeAssetType;
    if (layer.campaignRuns !== undefined) merged.campaignRuns = layer.campaignRuns;
    if (layer.seoCrawl !== undefined) merged.seoCrawl = layer.seoCrawl;
    if (layer.seoAudit !== undefined) merged.seoAudit = layer.seoAudit;
    if (layer.cachedAssets) {
      merged.cachedAssets = { ...merged.cachedAssets, ...layer.cachedAssets };
    }
    if (layer.assetHistory) {
      merged.assetHistory = { ...merged.assetHistory, ...layer.assetHistory };
    }
  }

  return merged;
}

export async function fetchCloudWorkspace(): Promise<WorkspacePayload | null> {
  const res = await apiFetch('/api/workspace/current');
  if (!res.ok) return null;
  const data = await res.json();
  return data.workspace?.payload || null;
}

export async function saveCloudWorkspace(payload: WorkspacePayload, name?: string): Promise<boolean> {
  const safePayload = sanitizeWorkspacePayload(payload);
  const res = await apiFetch('/api/workspace/current', {
    method: 'PUT',
    body: JSON.stringify({
      name: name || safePayload.brandAnalysis?.brandName || 'My workspace',
      brandUrl: safePayload.brandUrl,
      payload: safePayload,
    }),
  });
  return res.ok;
}

export async function startGoogleIntegration(service: 'gsc' | 'ga4'): Promise<void> {
  const res = await apiFetch(`/api/integrations/google/start?service=${service}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'OAuth start failed');
  }
  const { url } = await res.json();
  window.location.href = url;
}

export async function fetchLiveSeoData(siteUrl: string, ga4PropertyId?: string) {
  const params = new URLSearchParams({ siteUrl });
  if (ga4PropertyId) params.set('ga4PropertyId', ga4PropertyId);
  const res = await apiFetch(`/api/integrations/seo-data?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      googleSearchConsole: { connected: false as const },
      ga4: { connected: false as const },
    };
  }
  return data;
}

export async function publishToWordPress(input: {
  title: string;
  content: string;
  status?: 'draft' | 'publish';
  excerpt?: string;
}) {
  const res = await apiFetch('/api/publish/wordpress', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Publish failed');
  }
  return res.json();
}

export async function connectWordPress(siteUrl: string, username: string, appPassword: string) {
  const res = await apiFetch('/api/integrations/wordpress', {
    method: 'POST',
    body: JSON.stringify({ siteUrl, username, appPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Connect failed');
  }
}

export async function fetchIntegrationStatus(): Promise<{
  googleOAuthConfigured: boolean;
  connections: Record<string, { connected: boolean; metadata?: unknown }>;
}> {
  const res = await apiFetch('/api/integrations/status');
  if (!res.ok) throw new Error('Failed to load integration status');
  return res.json();
}

export async function disconnectGoogleIntegration(
  provider: 'google_search_console' | 'google_analytics'
): Promise<void> {
  const res = await apiFetch('/api/integrations/google/disconnect', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Disconnect failed');
  }
}

export async function exportMetaTags(pages: { url: string; title: string; metaDescription: string }[]) {
  const res = await apiFetch('/api/publish/meta-export', {
    method: 'POST',
    body: JSON.stringify({ pages }),
  });
  if (!res.ok) throw new Error('Meta export failed');
  return res.json() as Promise<{ html: string; json: typeof pages }>;
}
