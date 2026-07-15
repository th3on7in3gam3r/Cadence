/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Honest Cadence-side outbound activity for Pulse’s Cadence loop.
 * Not click/send tracking — counts campaign runs saved for the brand in-window.
 */

import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { pulseSiteIdFromDomain } from './pulseSite';
import { domainFromBrandUrl } from './websiteUrl';
import { pulseApiBase } from './growthStackConfig';

export type CadenceDrovePayload = {
  siteId: string;
  domain: string | null;
  windowDays: number;
  drove: number;
  metric: 'campaign_runs';
  label: string;
  asOf: string;
};

function partnerSecret(): string | null {
  return process.env.PULSE_PARTNER_SECRET?.trim() || null;
}

export function partnerSecretAuthorized(authHeader: string | null | undefined): boolean {
  const expected = partnerSecret();
  if (!expected) return false;
  const auth = authHeader?.trim();
  if (!auth?.toLowerCase().startsWith('bearer ')) return false;
  return auth.slice(7).trim() === expected;
}

/** Count campaign_runs for users who claimed this Pulse siteId, in the last N days. */
export async function computeCadenceDrove(
  siteId: string,
  windowDays: number,
): Promise<CadenceDrovePayload> {
  const days = Math.min(90, Math.max(1, Math.floor(windowDays) || 7));
  const asOf = new Date().toISOString();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const empty: CadenceDrovePayload = {
    siteId,
    domain: null,
    windowDays: days,
    drove: 0,
    metric: 'campaign_runs',
    label: 'campaign saves',
    asOf,
  };

  const sb = getSupabaseAdmin();
  if (!sb) return empty;

  const { data: claims, error: claimErr } = await sb
    .from('pulse_site_claims')
    .select('user_id, domain, site_id')
    .eq('site_id', siteId);

  if (claimErr || !claims?.length) return empty;

  const userIds = [...new Set(claims.map((c) => String(c.user_id)).filter(Boolean))];
  const domain = claims[0]?.domain ? String(claims[0].domain) : null;

  const { data: runs, error: runsErr } = await sb
    .from('campaign_runs')
    .select('id, user_id, brand_url, created_at')
    .in('user_id', userIds)
    .gte('created_at', since.toISOString());

  if (runsErr || !runs?.length) {
    return { ...empty, domain };
  }

  let drove = 0;
  for (const run of runs) {
    const brandUrl = run.brand_url?.trim();
    if (!brandUrl) {
      // Count unlabeled runs for claimed sites belonging to this user
      drove += 1;
      continue;
    }
    const domainFromBrand = domainFromBrandUrl(brandUrl);
    if (!domainFromBrand) {
      drove += 1;
      continue;
    }
    if (pulseSiteIdFromDomain(domainFromBrand) === siteId) drove += 1;
  }

  return {
    siteId,
    domain,
    windowDays: days,
    drove,
    metric: 'campaign_runs',
    label: 'campaign saves',
    asOf,
  };
}

/** Push Cadence outbound activity into Pulse (best-effort). */
export async function pushCadenceDroveToPulse(
  siteId: string,
  windowDays: number,
): Promise<boolean> {
  const secret = partnerSecret();
  if (!secret) return false;
  const payload = await computeCadenceDrove(siteId, windowDays);
  try {
    const res = await fetch(`${pulseApiBase()}/api/partner/drove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
