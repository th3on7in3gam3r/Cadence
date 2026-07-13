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

export function pulsePublicOrigin(): string {
  return pulseApiBase();
}

/** Pixel install snippet — read key is not embedded (stats auth is server-side in Cadence). */
export function pulseInstallSnippet(siteId: string, origin = pulsePublicOrigin()): string {
  const base = origin.replace(/\/+$/, '');
  const collectKey = process.env.PULSE_COLLECT_KEY?.trim();
  const keyAttr = collectKey ? ` data-key="${collectKey}"` : '';
  return `<script defer src="${base}/pulse.js" data-site="${siteId}"${keyAttr}></script>`;
}

export function pulseIdeInstallPrompt(siteId: string, origin = pulsePublicOrigin()): string {
  const snippet = pulseInstallSnippet(siteId, origin);
  return `Add Pulse website analytics to this project.

Use this exact script tag on every public-facing page (before </body>, or once in the root layout):

${snippet}

Requirements:
- Keep data-site="${siteId}" and the script src URL unchanged
- Load the script once per page load (defer is required)
- Next.js App Router: add via next/script in app/layout.tsx (strategy="afterInteractive")
- React/Vite/SPA: put in index.html or root layout — Pulse auto-tracks client-side route changes

After installing, verify events appear in Cadence → Settings → Integrations → Pulse.`;
}

export async function registerPulseSiteKeyOnPulse(siteId: string, readKey: string): Promise<boolean> {
  const secret = process.env.PULSE_PARTNER_SECRET?.trim();
  if (!secret) return false;

  try {
    const res = await fetch(`${pulseApiBase()}/api/partner/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ siteId, readKey }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getPulseClaimForUser(userId: string, domain: string) {
  const siteId = pulseSiteIdFromDomain(domain);
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from('pulse_site_claims')
    .select('id, site_id, domain, claimed_at')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) throw error;
  return data;
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
): Promise<{
  siteId: string;
  domain: string;
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

  const readKey = generatePulseReadKey();
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

  const registeredOnPulse = await registerPulseSiteKeyOnPulse(siteId, readKey);
  const origin = pulsePublicOrigin();

  return {
    siteId,
    domain,
    snippet: pulseInstallSnippet(siteId, origin),
    idePrompt: pulseIdeInstallPrompt(siteId, origin),
    dashboardUrl: `${origin}/?site=${encodeURIComponent(siteId)}`,
    claimedAt,
    registeredOnPulse,
  };
}

/** @deprecated Use enablePulseForBrand */
export async function claimPulseSiteForUser(userId: string, brandUrl: string) {
  return enablePulseForBrand(userId, brandUrl);
}
