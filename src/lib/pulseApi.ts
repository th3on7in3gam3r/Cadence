/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './api';

export interface PulseInstallInfo {
  domain: string;
  siteId: string;
  claimed: boolean;
  claimedAt: string | null;
  snippet: string;
  idePrompt: string;
  dashboardUrl: string;
}

export interface PulseClaimResult extends PulseInstallInfo {
  ok: boolean;
  registeredOnPulse: boolean;
  message: string;
}

export async function fetchPulseInstall(brandUrl?: string): Promise<PulseInstallInfo | null> {
  const qs = brandUrl ? `?brandUrl=${encodeURIComponent(brandUrl)}` : '';
  const res = await apiFetch(`/api/pulse/install${qs}`);
  if (res.status === 401) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to load Pulse install info');
  }
  return res.json() as Promise<PulseInstallInfo>;
}

export async function claimPulseSite(brandUrl?: string): Promise<PulseClaimResult> {
  const res = await apiFetch('/api/pulse/claim', {
    method: 'POST',
    body: JSON.stringify(brandUrl ? { brandUrl } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Failed to claim site');
  }
  return data as PulseClaimResult;
}
