/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { isSchemaNotReadyError, schemaSetupHint } from '../lib/dbErrors';
import { domainFromBrandUrl } from '../lib/websiteUrl';
import {
  claimPulseSiteForUser,
  getPulseClaimForUser,
  pulseIdeInstallPrompt,
  pulseInstallSnippet,
  pulsePublicOrigin,
} from '../lib/pulseClaim';
import { pulseSiteIdFromDomain } from '../lib/pulseSite';

const router = Router();

async function resolveBrandUrl(userId: string, override?: string): Promise<string | null> {
  const fromBody = override?.trim();
  if (fromBody) return fromBody;

  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from('workspaces')
    .select('brand_url')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.brand_url?.trim() || null;
}

router.get('/install', requireUser, async (req: AuthedRequest, res) => {
  try {
    const brandUrl = await resolveBrandUrl(req.userId!, String(req.query.brandUrl || ''));
    if (!brandUrl) {
      return res.status(400).json({
        error: 'No brand URL in workspace. Analyze your site or set a URL in Settings first.',
      });
    }

    const domain = domainFromBrandUrl(brandUrl);
    if (!domain) {
      return res.status(400).json({ error: 'Invalid brand URL.' });
    }

    const siteId = pulseSiteIdFromDomain(domain);
    const claim = await getPulseClaimForUser(req.userId!, domain);
    const origin = pulsePublicOrigin();

    return res.json({
      domain,
      siteId,
      claimed: Boolean(claim),
      claimedAt: claim?.claimed_at ?? null,
      snippet: pulseInstallSnippet(siteId, origin),
      idePrompt: pulseIdeInstallPrompt(siteId, origin),
      dashboardUrl: `${origin}/?site=${encodeURIComponent(siteId)}`,
    });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to load Pulse install info';
    return res.status(500).json({ error: msg });
  }
});

router.post('/claim', requireUser, async (req: AuthedRequest, res) => {
  try {
    const brandUrl = await resolveBrandUrl(req.userId!, req.body?.brandUrl);
    if (!brandUrl) {
      return res.status(400).json({
        error: 'No brand URL in workspace. Analyze your site or set a URL in Settings first.',
      });
    }

    const result = await claimPulseSiteForUser(req.userId!, brandUrl);
    return res.json({
      ok: true,
      ...result,
      message:
        'Site claimed. Copy the snippet below — Pulse analytics is included with Cadence (no separate key purchase).',
    });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to claim site';
    return res.status(500).json({ error: msg });
  }
});

export default router;
