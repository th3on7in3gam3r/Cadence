/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './api';

export interface CitePilotCitationsResponse {
  connected: boolean;
  domain?: string;
  hasAudit?: boolean;
  score?: number | null;
  cited?: number | null;
  total?: number | null;
  platforms?: { name: string; present: boolean; share?: number }[];
  gaps?: string[];
  auditedAt?: string | null;
  trend?: number | null;
  reportUrl?: string;
  auditUrl?: string;
  error?: string;
}

export interface AegisUrlCheckResponse {
  connected: boolean;
  url?: string;
  status?: 'complete' | 'failed';
  score?: number;
  grade?: string;
  summary?: string;
  https?: boolean;
  hsts?: boolean;
  csp?: boolean;
  findingCount?: { critical: number; warning: number; info: number };
  findings?: { severity: string; title: string; message: string }[];
  reportUrl?: string;
  marketerNote?: string;
  error?: string;
}

export interface PulseStatsResponse {
  connected: boolean;
  siteId?: string;
  dashboardUrl?: string;
  live?: boolean;
  visitors?: number;
  views?: number;
  conversions?: number;
  conversionRate?: number;
  totalEvents?: number;
  error?: string;
}

export async function fetchCitePilotCitations(
  domain: string,
  citePilotApiKey?: string,
): Promise<CitePilotCitationsResponse> {
  const headers: Record<string, string> = {};
  if (citePilotApiKey?.trim()) {
    headers['X-CitePilot-Api-Key'] = citePilotApiKey.trim();
  }
  const res = await apiFetch(
    `/api/integrations/growth-stack/citepilot/citations?domain=${encodeURIComponent(domain)}`,
    { headers },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      connected: false,
      error: (data as { error?: string }).error || 'Could not load CitePilot data',
    };
  }
  return data as CitePilotCitationsResponse;
}

export async function fetchAegisUrlCheck(url: string): Promise<AegisUrlCheckResponse> {
  const res = await apiFetch(
    `/api/integrations/growth-stack/aegis/url-check?url=${encodeURIComponent(url)}`,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      connected: false,
      error: (data as { error?: string }).error || 'Could not run security check',
    };
  }
  return data as AegisUrlCheckResponse;
}

export async function fetchPulseStats(domain: string): Promise<PulseStatsResponse> {
  const res = await apiFetch(
    `/api/integrations/growth-stack/pulse/stats?domain=${encodeURIComponent(domain)}`,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      connected: false,
      error: (data as { error?: string }).error || 'Could not load Pulse stats',
    };
  }
  return data as PulseStatsResponse;
}
