/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { aegisApiBase, citePilotApiBase, pulseApiBase, pulseReadKeyForSite } from '../lib/growthStackConfig';
import { getGrowthStackKeysForUser } from '../lib/growthStackKeys';
import { getPulseReadKeyForUser } from '../lib/pulseClaim';
import type { AuthedRequest } from '../middleware/requireUser';
import { pulseSiteIdFromDomain } from '../lib/pulseSite';
import { domainFromBrandUrl, normalizeBrandUrl } from '../lib/websiteUrl';

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

async function localUrlSecurityCheck(rawUrl: string) {
  const url = normalizeBrandUrl(rawUrl);
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Cadence-GrowthStack/1.0' },
  });

  const finalUrl = res.url || url;
  const headers = res.headers;
  const checks = [
    {
      name: 'HTTPS',
      ok: finalUrl.startsWith('https://'),
      detail: finalUrl.startsWith('https://') ? 'Served over TLS' : 'Not served over HTTPS',
    },
    {
      name: 'HSTS',
      ok: !!headers.get('strict-transport-security'),
      detail: headers.get('strict-transport-security') ? 'Present' : 'Missing',
    },
    {
      name: 'X-Frame-Options',
      ok: !!headers.get('x-frame-options'),
      detail: headers.get('x-frame-options') || 'Missing',
    },
    {
      name: 'CSP',
      ok: !!headers.get('content-security-policy'),
      detail: headers.get('content-security-policy') ? 'Present' : 'Missing',
    },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);

  return {
    url: finalUrl,
    reachable: res.ok,
    status: res.status,
    score,
    checks,
    source: 'local-fallback',
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

    const upstream = await fetch(
      `${base}/api/v1/url-check?url=${encodeURIComponent(url)}`,
      { headers },
    );

    if (upstream.ok) {
      const data = await upstream.json();
      return res.json({ connected: true, source: 'aegis-api', ...data });
    }

    try {
      const fallback = await localUrlSecurityCheck(url);
      return res.json({ connected: true, ...fallback });
    } catch (fallbackErr: unknown) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status === 404 ? 502 : upstream.status).json({
        error:
          (err as { error?: string }).error ||
          (fallbackErr instanceof Error ? fallbackErr.message : 'Aegis URL check failed'),
        connected: false,
      });
    }
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
    const dashboardUrl = `${base}/?site=${encodeURIComponent(siteId)}`;
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

    const upstream = await fetch(
      `${base}/api/stats?siteId=${encodeURIComponent(siteId)}`,
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
    return res.json({
      connected: true,
      source: 'pulse-api',
      siteId,
      dashboardUrl: `${base}/?site=${encodeURIComponent(siteId)}`,
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
