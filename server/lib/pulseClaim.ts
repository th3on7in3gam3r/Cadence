/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { pulseApiBase } from './growthStackConfig';
import { pulseSitesLimit, type PlanId } from './plans';
import { getUserPlan } from './usage';
import { pulseSiteIdFromDomain } from './pulseSite';
import { domainFromBrandUrl } from './websiteUrl';

export interface WorkspacePulseMeta {
  siteId: string;
  domain: string;
  enabledAt: string;
}

export function generatePulseReadKey(): string {
  return `psk_${crypto.randomBytes(24).toString('base64url')}`;
}

export function generatePulseCollectKey(): string {
  return `pck_${crypto.randomBytes(24).toString('base64url')}`;
}

export function pulsePublicOrigin(): string {
  return pulseApiBase();
}

/**
 * Pixel install snippet.
 * Prefer per-site collect key (pck_…). Global PULSE_COLLECT_KEY is a master override fallback.
 * Never embed the dashboard read key (psk_…).
 */
export function pulseInstallSnippet(
  siteId: string,
  origin = pulsePublicOrigin(),
  collectKey?: string | null,
): string {
  const base = origin.replace(/\/+$/, '');
  const key =
    collectKey?.trim() ||
    process.env.PULSE_COLLECT_KEY?.trim() ||
    '';
  const keyAttr = key ? ` data-key="${key}"` : '';
  return `<script defer src="${base}/pulse.js" data-site="${siteId}"${keyAttr}></script>`;
}

export function pulseIdeInstallPrompt(
  siteId: string,
  origin = pulsePublicOrigin(),
  collectKey?: string | null,
): string {
  const snippet = pulseInstallSnippet(siteId, origin, collectKey);
  return `Add Pulse website analytics to this project.

Use this exact script tag on every public-facing page (before </body>, or once in the root layout):

${snippet}

Requirements:
- Keep data-site="${siteId}" and the script src URL unchanged
- Keep data-key if present (per-site collect key) — do not put the Dashboard read key (psk_…) on the pixel
- Load the script once per page load (defer is required)
- Next.js App Router: add via next/script in app/layout.tsx (strategy="afterInteractive")
- React/Vite/SPA: put in index.html or root layout — Pulse auto-tracks client-side route changes

After installing, verify events appear in Cadence → Settings → Integrations → Pulse.`;
}

export async function registerPulseSiteKeyOnPulse(
  siteId: string,
  readKey: string,
  collectKey?: string | null,
): Promise<boolean> {
  const secret = process.env.PULSE_PARTNER_SECRET?.trim();
  if (!secret) return false;

  try {
    const res = await fetch(`${pulseApiBase()}/api/partner/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        siteId,
        readKey,
        ...(collectKey?.trim() ? { collectKey: collectKey.trim() } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Mint Cadence → Pulse SSO redeem URL (falls back to bare site link). */
export async function mintPulseDashboardUrl(siteId: string): Promise<string> {
  const origin = pulsePublicOrigin();
  const fallback = `${origin}/?site=${encodeURIComponent(siteId)}`;
  const secret = process.env.PULSE_PARTNER_SECRET?.trim();
  if (!secret) return fallback;

  try {
    const res = await fetch(`${pulseApiBase()}/api/partner/sso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ siteId, ttlSeconds: 300 }),
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { url?: string };
    return data.url?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function getPulseClaimForUser(userId: string, domain: string) {
  const siteId = pulseSiteIdFromDomain(domain);
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from('pulse_site_claims')
    .select('id, site_id, domain, claimed_at, pulse_read_key, pulse_collect_key')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) throw error;
  return data as {
    id: string;
    site_id: string;
    domain: string;
    claimed_at: string;
    pulse_read_key: string;
    pulse_collect_key?: string | null;
  } | null;
}

/** Ensure claim has a collect key; persist if missing. */
export async function ensureCollectKeyForClaim(
  userId: string,
  siteId: string,
  existing: string | null | undefined,
): Promise<string> {
  if (existing?.trim()) return existing.trim();
  const collectKey = generatePulseCollectKey();
  const sb = getSupabaseAdmin();
  if (!sb) return collectKey;
  await sb
    .from('pulse_site_claims')
    .update({ pulse_collect_key: collectKey })
    .eq('user_id', userId)
    .eq('site_id', siteId);
  return collectKey;
}

export async function countPulseSitesForUser(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const { count, error } = await sb
    .from('pulse_site_claims')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

async function syncPulseToWorkspacePayload(
  userId: string,
  pulse: WorkspacePulseMeta,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { data: ws } = await sb
    .from('workspaces')
    .select('id, payload')
    .eq('user_id', userId)
    .maybeSingle();

  const payload =
    ws?.payload && typeof ws.payload === 'object' && !Array.isArray(ws.payload)
      ? { ...(ws.payload as Record<string, unknown>) }
      : {};

  payload.pulse = pulse;

  await sb
    .from('workspaces')
    .update({ payload, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}

export async function getPulseQuotaForUser(userId: string): Promise<{
  plan: PlanId;
  sitesUsed: number;
  sitesLimit: number;
}> {
  const plan = await getUserPlan(userId);
  const sitesUsed = await countPulseSitesForUser(userId);
  return { plan, sitesUsed, sitesLimit: pulseSitesLimit(plan) };
}

export async function getPulseReadKeyForUser(userId: string, siteId: string): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from('pulse_site_claims')
    .select('pulse_read_key')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) throw error;
  return data?.pulse_read_key?.trim() || null;
}

export async function enablePulseForBrand(
  userId: string,
  brandUrl: string,
  opts?: { rotateKey?: boolean },
): Promise<{
  siteId: string;
  domain: string;
  readKey: string;
  collectKey: string;
  snippet: string;
  idePrompt: string;
  dashboardUrl: string;
  claimedAt: string;
  registeredOnPulse: boolean;
}> {
  const domain = domainFromBrandUrl(brandUrl);
  if (!domain) {
    throw new Error('Enter a valid website URL in your workspace first.');
  }

  const siteId = pulseSiteIdFromDomain(domain);
  const existing = await getPulseClaimForUser(userId, domain);
  if (!existing) {
    const { sitesUsed, sitesLimit, plan } = await getPulseQuotaForUser(userId);
    if (sitesUsed >= sitesLimit) {
      throw new Error(
        plan === 'free'
          ? 'Free plan includes Pulse for 1 site. Upgrade to Pro or add Pulse via a Growth Stack bundle for more brands.'
          : 'Pulse site limit reached for your plan.',
      );
    }
  }

  const origin = pulsePublicOrigin();
  const reuseExisting =
    Boolean(existing?.pulse_read_key) && !opts?.rotateKey;

  if (reuseExisting && existing) {
    const readKey = String(existing.pulse_read_key).trim();
    const collectKey = await ensureCollectKeyForClaim(
      userId,
      siteId,
      existing.pulse_collect_key,
    );
    const claimedAt = existing.claimed_at || new Date().toISOString();
    await syncPulseToWorkspacePayload(userId, {
      siteId,
      domain,
      enabledAt: claimedAt,
    });
    const registeredOnPulse = await registerPulseSiteKeyOnPulse(
      siteId,
      readKey,
      collectKey,
    );
    if (registeredOnPulse) {
      const { pushCadenceDroveToPulse } = await import('./cadenceDrove');
      void pushCadenceDroveToPulse(siteId, 7);
    }
    const dashboardUrl = await mintPulseDashboardUrl(siteId);
    return {
      siteId,
      domain,
      readKey,
      collectKey,
      snippet: pulseInstallSnippet(siteId, origin, collectKey),
      idePrompt: pulseIdeInstallPrompt(siteId, origin, collectKey),
      dashboardUrl,
      claimedAt,
      registeredOnPulse,
    };
  }

  const readKey = generatePulseReadKey();
  const collectKey = generatePulseCollectKey();
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Cloud database is not configured.');

  const { data: workspace } = await sb
    .from('workspaces')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const claimedAt = new Date().toISOString();
  const { error } = await sb.from('pulse_site_claims').upsert(
    {
      user_id: userId,
      workspace_id: workspace?.id ?? null,
      site_id: siteId,
      domain,
      pulse_read_key: readKey,
      pulse_collect_key: collectKey,
      claimed_at: claimedAt,
    },
    { onConflict: 'user_id,site_id' },
  );

  if (error) throw error;

  await syncPulseToWorkspacePayload(userId, {
    siteId,
    domain,
    enabledAt: claimedAt,
  });

  const registeredOnPulse = await registerPulseSiteKeyOnPulse(
    siteId,
    readKey,
    collectKey,
  );
  if (registeredOnPulse) {
    const { pushCadenceDroveToPulse } = await import('./cadenceDrove');
    void pushCadenceDroveToPulse(siteId, 7);
  }

  const dashboardUrl = await mintPulseDashboardUrl(siteId);
  return {
    siteId,
    domain,
    readKey,
    collectKey,
    snippet: pulseInstallSnippet(siteId, origin, collectKey),
    idePrompt: pulseIdeInstallPrompt(siteId, origin, collectKey),
    dashboardUrl,
    claimedAt,
    registeredOnPulse,
  };
}

/** Re-push the existing Cadence read key to Pulse (after PULSE_PARTNER_SECRET is configured). */
export async function resyncPulseSiteKeyForUser(
  userId: string,
  brandUrl: string,
): Promise<{
  siteId: string;
  domain: string;
  readKey: string;
  collectKey: string;
  registeredOnPulse: boolean;
  dashboardUrl: string;
  snippet: string;
  idePrompt: string;
}> {
  const domain = domainFromBrandUrl(brandUrl);
  if (!domain) {
    throw new Error('Enter a valid website URL in your workspace first.');
  }

  const siteId = pulseSiteIdFromDomain(domain);
  const claim = await getPulseClaimForUser(userId, domain);
  if (!claim?.pulse_read_key) {
    throw new Error('Enable Pulse for this brand first, then retry sync.');
  }

  const readKey = String(claim.pulse_read_key).trim();
  const collectKey = await ensureCollectKeyForClaim(
    userId,
    siteId,
    claim.pulse_collect_key,
  );
  const registeredOnPulse = await registerPulseSiteKeyOnPulse(
    siteId,
    readKey,
    collectKey,
  );
  if (registeredOnPulse) {
    const { pushCadenceDroveToPulse } = await import('./cadenceDrove');
    void pushCadenceDroveToPulse(siteId, 7);
  }
  const origin = pulsePublicOrigin();
  const dashboardUrl = await mintPulseDashboardUrl(siteId);

  return {
    siteId,
    domain,
    readKey,
    collectKey,
    registeredOnPulse,
    dashboardUrl,
    snippet: pulseInstallSnippet(siteId, origin, collectKey),
    idePrompt: pulseIdeInstallPrompt(siteId, origin, collectKey),
  };
}

/** @deprecated Use enablePulseForBrand */
export async function claimPulseSiteForUser(userId: string, brandUrl: string) {
  return enablePulseForBrand(userId, brandUrl);
}
