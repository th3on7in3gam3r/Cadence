/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './api';

export interface PulseInstallInfo {
  domain: string;
  siteId: string;
  enabled: boolean;
  /** @deprecated use enabled */
  claimed: boolean;
  claimedAt: string | null;
  enabledAt?: string | null;
  registeredOnPulse?: boolean | null;
  /** Paste into Pulse dashboard when it asks for a site read key. */
  readKey?: string | null;
  snippet: string;
  idePrompt: string;
  dashboardUrl: string;
  sitesUsed: number;
  sitesLimit: number;
  plan: string;
}

export interface PulseEnableResult extends PulseInstallInfo {
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

export async function enablePulseForBrand(
  brandUrl?: string,
  opts?: { rotateKey?: boolean },
): Promise<PulseEnableResult> {
  const res = await apiFetch('/api/pulse/enable', {
    method: 'POST',
    body: JSON.stringify({
      ...(brandUrl ? { brandUrl } : {}),
      ...(opts?.rotateKey ? { rotateKey: true } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Failed to enable Pulse');
  }
  return data as PulseEnableResult;
}

/** Re-register the existing Cadence read key on Pulse (Retry sync). */
export async function resyncPulseForBrand(brandUrl?: string): Promise<PulseEnableResult> {
  const res = await apiFetch('/api/pulse/resync', {
    method: 'POST',
    body: JSON.stringify(brandUrl ? { brandUrl } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Failed to sync Pulse key');
  }
  return data as PulseEnableResult;
}

/** @deprecated Use enablePulseForBrand */
export async function claimPulseSite(brandUrl?: string): Promise<PulseEnableResult> {
  return enablePulseForBrand(brandUrl);
}
