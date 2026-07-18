/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeBrandUrl } from './websiteUrl';

export type SecurityGrade = 'A' | 'B' | 'C' | 'D';

export interface LocalSecurityCheckResult {
  url: string;
  reachable: boolean;
  httpStatus: number;
  score: number;
  checks: { name: string; ok: boolean; detail: string }[];
}

export const SECURITY_PROBE_FRIENDLY_ERROR =
  "We couldn't reach this URL from our security probe. Check that the site is publicly accessible, then try again.";

const DEFAULT_AEGIS_REPORT_URL = 'https://aegis-loop.com/';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (compatible; Cadence-GrowthStack/1.0; +https://growth.biblefunland.com)';

export function securityGradeFromScore(score: number): SecurityGrade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

export function isAegisPayloadUsable(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  return (data as { status?: string }).status !== 'failed';
}

function checkByName(checks: LocalSecurityCheckResult['checks'], name: string): boolean {
  return checks.find((c) => c.name === name)?.ok ?? false;
}

export function mapLocalSecurityToAegisResponse(
  fallback: LocalSecurityCheckResult,
  reportUrl = DEFAULT_AEGIS_REPORT_URL,
) {
  const passed = fallback.checks.filter((c) => c.ok).length;
  const https = checkByName(fallback.checks, 'HTTPS');
  const hsts = checkByName(fallback.checks, 'HSTS');
  const csp = checkByName(fallback.checks, 'CSP');
  const xfo = checkByName(fallback.checks, 'X-Frame-Options');

  const critical = https ? 0 : 1;
  const warning = (!hsts ? 1 : 0) + (!csp ? 1 : 0);
  const info = !xfo ? 1 : 0;

  return {
    connected: true as const,
    source: 'cadence-local' as const,
    url: fallback.url,
    status: 'complete' as const,
    score: fallback.score,
    grade: securityGradeFromScore(fallback.score),
    summary: `${passed} of ${fallback.checks.length} header checks passed`,
    https,
    hsts,
    csp,
    findingCount: { critical, warning, info },
    findings: [] as { severity: string; title: string; message: string }[],
    reportUrl,
    marketerNote:
      'Lightweight header check from Cadence. Connect GitHub in Aegis Loop for full repo and PR security scans.',
  };
}

export async function localUrlSecurityCheck(rawUrl: string): Promise<LocalSecurityCheckResult> {
  const url = normalizeBrandUrl(rawUrl);
  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    headers: {
      Accept: 'text/html,*/*',
      'User-Agent': BROWSER_USER_AGENT,
    },
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
    reachable: true,
    httpStatus: res.status,
    score,
    checks,
  };
}

export async function performAegisUrlCheck(params: {
  targetUrl: string;
  fetchAegis: () => Promise<Response>;
  reportUrl?: string;
}): Promise<Record<string, unknown>> {
  try {
    const upstream = await params.fetchAegis();
    if (upstream.ok) {
      const data = await upstream.json();
      if (isAegisPayloadUsable(data)) {
        return { connected: true, source: 'aegis-api', ...(data as Record<string, unknown>) };
      }
    }
  } catch {
    // Fall through to Cadence-local probe.
  }

  try {
    const fallback = await localUrlSecurityCheck(params.targetUrl);
    return mapLocalSecurityToAegisResponse(fallback, params.reportUrl);
  } catch {
    return {
      connected: false,
      error: SECURITY_PROBE_FRIENDLY_ERROR,
    };
  }
}
