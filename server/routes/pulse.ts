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
  ensureCollectKeyForClaim,
  getPulseClaimForUser,
  getPulseQuotaForUser,
  mintPulseDashboardUrl,
  pulseIdeInstallPrompt,
  pulseInstallSnippet,
  pulsePublicOrigin,
  registerPulseSiteKeyOnPulse,
  resyncPulseSiteKeyForUser,
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
    let collectKey: string | null = null;
    let registeredOnPulse: boolean | null = null;
    if (enabled && claim?.pulse_read_key) {
      collectKey = await ensureCollectKeyForClaim(
        req.userId!,
        siteId,
        claim.pulse_collect_key,
      );
      registeredOnPulse = await registerPulseSiteKeyOnPulse(
        siteId,
        String(claim.pulse_read_key).trim(),
        collectKey,
      );
    }

    const dashboardUrl = enabled
      ? await mintPulseDashboardUrl(siteId)
      : `${origin}/?site=${encodeURIComponent(siteId)}`;

    return res.json({
      domain,
      siteId,
      enabled,
      claimed: enabled,
      claimedAt: claim?.claimed_at ?? null,
      enabledAt: claim?.claimed_at ?? null,
      registeredOnPulse,
      /** Dashboard unlock key — paste into Pulse when prompted. Never put on the pixel. */
      readKey: claim?.pulse_read_key ? String(claim.pulse_read_key).trim() : null,
      snippet: pulseInstallSnippet(siteId, origin, collectKey),
      idePrompt: pulseIdeInstallPrompt(siteId, origin, collectKey),
      dashboardUrl,
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

    const result = await enablePulseForBrand(req.userId!, brandUrl, {
      rotateKey: Boolean(req.body?.rotateKey),
    });
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
      message: result.registeredOnPulse
        ? 'Pulse enabled. Copy the Dashboard read key into Pulse if the dashboard asks to unlock.'
        : 'Pulse saved in Cadence, but key sync to Pulse failed. Check PULSE_PARTNER_SECRET on both services, then Retry sync.',
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

router.post('/resync', requireUser, async (req: AuthedRequest, res) => {
  try {
    const brandUrl = await resolveBrandUrl(req.userId!, req.body?.brandUrl);
    if (!brandUrl) {
      return res.status(400).json({
        error: 'No brand URL in workspace. Analyze your site or set a URL in Settings first.',
      });
    }

    const result = await resyncPulseSiteKeyForUser(req.userId!, brandUrl);
    const claim = await getPulseClaimForUser(req.userId!, result.domain);
    const quota = await getPulseQuotaForUser(req.userId!);

    return res.json({
      ok: true,
      ...result,
      enabled: true,
      claimed: true,
      claimedAt: claim?.claimed_at ?? null,
      enabledAt: claim?.claimed_at ?? null,
      sitesUsed: quota.sitesUsed,
      sitesLimit: quota.sitesLimit,
      plan: quota.plan,
      message: result.registeredOnPulse
        ? 'Synced to Pulse. This site is now locked to your Cadence read key.'
        : 'Sync failed. Set the same PULSE_PARTNER_SECRET on Cadence and Pulse, redeploy both, then retry.',
    });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to sync Pulse key';
    const status = msg.includes('Enable Pulse') ? 400 : 500;
    return res.status(status).json({ error: msg });
  }
});

router.post('/claim', requireUser, (req, res) => handleEnable(req, res));

/** Fresh Cadence → Pulse SSO dashboard link (one-time redeem URL). */
router.get('/dashboard-link', requireUser, async (req: AuthedRequest, res) => {
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
    const claim = await getPulseClaimForUser(req.userId!, domain);
    if (!claim?.pulse_read_key) {
      return res.status(400).json({ error: 'Enable Pulse for this brand first.' });
    }
    const siteId = pulseSiteIdFromDomain(domain);
    const url = await mintPulseDashboardUrl(siteId);
    return res.json({ ok: true, siteId, url });
  } catch (e: unknown) {
    if (isSchemaNotReadyError(e)) {
      return res.status(503).json({ error: 'Database tables not set up', setupHint: schemaSetupHint() });
    }
    const msg = e instanceof Error ? e.message : 'Failed to mint Pulse dashboard link';
    return res.status(500).json({ error: msg });
  }
});

export default router;
