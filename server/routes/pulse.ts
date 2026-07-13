/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, type Response } from 'express';
import { requireUser, type AuthedRequest } from '../middleware/requireUser';
import { getSupabaseAdmin } from '../db/supabaseAdmin';
import { isSchemaNotReadyError, schemaSetupHint } from '../lib/dbErrors';
import { domainFromBrandUrl } from '../lib/websiteUrl';
import {
  enablePulseForBrand,
  getPulseClaimForUser,
  getPulseQuotaForUser,
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
    const quota = await getPulseQuotaForUser(req.userId!);
    const origin = pulsePublicOrigin();
    const enabled = Boolean(claim);

    return res.json({
      domain,
      siteId,
      enabled,
      claimed: enabled,
      claimedAt: claim?.claimed_at ?? null,
      enabledAt: claim?.claimed_at ?? null,
      snippet: pulseInstallSnippet(siteId, origin),
      idePrompt: pulseIdeInstallPrompt(siteId, origin),
      dashboardUrl: `${origin}/?site=${encodeURIComponent(siteId)}`,
      sitesUsed: quota.sitesUsed,
      sitesLimit: quota.sitesLimit,
      plan: quota.plan,
    });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to load Pulse install info';
    return res.status(500).json({ error: msg });
  }
});

async function handleEnable(req: AuthedRequest, res: Response) {
  try {
    const brandUrl = await resolveBrandUrl(req.userId!, req.body?.brandUrl);
    if (!brandUrl) {
      return res.status(400).json({
        error: 'No brand URL in workspace. Analyze your site or set a URL in Settings first.',
      });
    }

    const result = await enablePulseForBrand(req.userId!, brandUrl);
    const quota = await getPulseQuotaForUser(req.userId!);
    return res.json({
      ok: true,
      ...result,
      enabled: true,
      claimed: true,
      enabledAt: result.claimedAt,
      sitesUsed: quota.sitesUsed,
      sitesLimit: quota.sitesLimit,
      plan: quota.plan,
      message:
        'Pulse enabled for this brand. Copy the snippet below — no separate key purchase; billing can bundle Pulse later.',
    });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to enable Pulse';
    const status = msg.includes('Free plan includes') || msg.includes('limit reached') ? 403 : 500;
    return res.status(status).json({ error: msg });
  }
}

router.post('/enable', requireUser, (req, res) => handleEnable(req, res));

router.post('/claim', requireUser, (req, res) => handleEnable(req, res));

export default router;
