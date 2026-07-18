/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { performAegisUrlCheck } from '../lib/aegisUrlCheck';
import { aegisApiBase, citePilotApiBase, pulseApiBase, pulseReadKeyForSite } from '../lib/growthStackConfig';
import { getGrowthStackKeysForUser } from '../lib/growthStackKeys';
import { getPulseReadKeyForUser, mintPulseDashboardUrl } from '../lib/pulseClaim';
import type { AuthedRequest } from '../middleware/requireUser';
import { pulseSiteIdFromDomain } from '../lib/pulseSite';
import { domainFromBrandUrl, normalizeBrandUrl } from '../lib/websiteUrl';
import { pushCadenceDroveToPulse } from '../lib/cadenceDrove';

const router = Router();

function normalizeDomain(input: string): string {
  return domainFromBrandUrl(input);
}

async function fetchCitePilotWidget(
  domain: string,
  base: string,
  headers: Record<string, string>,
) {
  const res = await fetch(
    `${base}/api/widget/score/${encodeURIComponent(domain)}?format=json`,
    { headers },
  );
  if (!res.ok) return null;

  const widget = (await res.json()) as {
    hasAudit?: boolean;
    score?: number | null;
    cited?: number | null;
    total?: number | null;
    platforms?: unknown[];
  };

  return {
    domain,
    hasAudit: widget.hasAudit ?? true,
    score: widget.score ?? null,
    cited: widget.cited ?? null,
    total: widget.total ?? null,
    platforms: widget.platforms ?? [],
    auditUrl: `${base}/audit?domain=${encodeURIComponent(domain)}`,
    source: 'citepilot-widget-fallback',
  };
}

router.get('/citepilot/citations', async (req: AuthedRequest, res) => {
  try {
    const domain = normalizeDomain(String(req.query.domain || ''));
    if (!domain) {
      return res.status(400).json({ error: 'domain query parameter is required' });
    }

    const base = citePilotApiBase();
    const headers: Record<string, string> = { Accept: 'application/json' };
    const clientKey = (req.headers['x-citepilot-api-key'] as string | undefined)?.trim();
    let partnerKey = clientKey || process.env.CITEPILOT_PARTNER_API_KEY?.trim();
    if (!partnerKey && req.userId) {
      const stored = await getGrowthStackKeysForUser(req.userId);
      partnerKey = stored.citePilotApiKey || partnerKey;
    }
    if (partnerKey) {
      headers.Authorization = `Bearer ${partnerKey}`;
    }

    const upstream = await fetch(
      `${base}/api/v1/citations?domain=${encodeURIComponent(domain)}`,
      { headers },
    );

    if (upstream.ok) {
      const data = await upstream.json();
      return res.json({ connected: true, source: 'citepilot-api', ...data });
    }

    const widget = await fetchCitePilotWidget(domain, base, headers);
    if (widget) {
      return res.json({ connected: true, ...widget });
    }

    const err = await upstream.json().catch(() => ({}));
    return res.status(upstream.status === 404 ? 502 : upstream.status).json({
      error: (err as { error?: string }).error || 'CitePilot request failed',
      connected: false,
    });
  } catch (e: unknown) {
    return res.status(502).json({
      error: e instanceof Error ? e.message : 'CitePilot unavailable',
      connected: false,
    });
  }
});

router.get('/aegis/url-check', async (req: AuthedRequest, res) => {
  try {
    const url = normalizeBrandUrl(String(req.query.url || '').trim());
    if (!url) {
      return res.status(400).json({ error: 'url query parameter is required' });
    }

    const base = aegisApiBase();
    const headers: Record<string, string> = { Accept: 'application/json' };
    const clientKey = (req.headers['x-aegis-api-key'] as string | undefined)?.trim();
    let partnerKey = clientKey || process.env.AEGIS_PARTNER_API_KEY?.trim();
    if (!partnerKey && req.userId) {
      const stored = await getGrowthStackKeysForUser(req.userId);
      partnerKey = stored.aegisApiKey || partnerKey;
    }
    if (partnerKey) {
      headers.Authorization = `Bearer ${partnerKey}`;
    }

    const result = await performAegisUrlCheck({
      targetUrl: url,
      fetchAegis: () =>
        fetch(`${base}/api/v1/url-check?url=${encodeURIComponent(url)}`, { headers }),
    });
    return res.json(result);
  } catch (e: unknown) {
    return res.status(502).json({
      error: e instanceof Error ? e.message : 'Aegis Loop unavailable',
      connected: false,
    });
  }
});

router.get('/pulse/stats', async (req: AuthedRequest, res) => {
  try {
    const domain = normalizeDomain(String(req.query.domain || ''));
    if (!domain) {
      return res.status(400).json({ error: 'domain query parameter is required' });
    }

    const siteId = pulseSiteIdFromDomain(domain);
    const base = pulseApiBase();
    const dashboardUrl = await mintPulseDashboardUrl(siteId);
    const headers: Record<string, string> = { Accept: 'application/json' };
    const claimedKey = req.userId ? await getPulseReadKeyForUser(req.userId, siteId) : null;
    const readKey = claimedKey || pulseReadKeyForSite(siteId);

    if (!readKey) {
      return res.json({
        connected: false,
        live: false,
        siteId,
        dashboardUrl,
        error: 'Enable Pulse for this brand in Settings → Integrations.',
      });
    }

    headers['X-Pulse-Key'] = readKey;

    const rangeRaw = String(req.query.range || req.query.days || '7').trim();
    const rangeDays = [1, 7, 30].includes(Number(rangeRaw))
      ? Number(rangeRaw)
      : 7;

    const upstream = await fetch(
      `${base}/api/stats?siteId=${encodeURIComponent(siteId)}&range=${rangeDays}`,
      { headers },
    );

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      const authFailed = upstream.status === 401 || upstream.status === 403;
      if (authFailed || upstream.status === 404) {
        return res.json({
          connected: false,
          live: false,
          siteId,
          dashboardUrl,
          error: authFailed
            ? claimedKey
              ? 'Pulse key is out of sync — open Settings → Integrations and use Retry sync.'
              : 'Enable Pulse for this brand in Settings → Integrations.'
            : (err as { error?: string }).error || 'No Pulse data for this site yet.',
        });
      }
      return res.status(upstream.status === 404 ? 502 : upstream.status).json({
        connected: false,
        error: (err as { error?: string }).error || 'Pulse request failed',
        siteId,
        dashboardUrl,
      });
    }

    const stats = await upstream.json();
    // Refresh Pulse Cadence-loop “drove” for the same window as stats (best-effort).
    void pushCadenceDroveToPulse(siteId, rangeDays);
    return res.json({
      connected: true,
      source: 'pulse-api',
      siteId,
      dashboardUrl,
      ...stats,
    });
  } catch (e: unknown) {
    return res.status(502).json({
      connected: false,
      error: e instanceof Error ? e.message : 'Pulse unavailable',
    });
  }
});

export default router;
