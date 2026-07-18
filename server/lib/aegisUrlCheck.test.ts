/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SECURITY_PROBE_FRIENDLY_ERROR,
  isAegisPayloadUsable,
  localUrlSecurityCheck,
  mapLocalSecurityToAegisResponse,
  performAegisUrlCheck,
  securityGradeFromScore,
} from './aegisUrlCheck';

describe('securityGradeFromScore', () => {
  it('maps score bands to grades', () => {
    expect(securityGradeFromScore(90)).toBe('A');
    expect(securityGradeFromScore(75)).toBe('B');
    expect(securityGradeFromScore(55)).toBe('C');
    expect(securityGradeFromScore(20)).toBe('D');
  });
});

describe('isAegisPayloadUsable', () => {
  it('rejects failed Aegis payloads', () => {
    expect(isAegisPayloadUsable({ status: 'failed', summary: 'fetch failed' })).toBe(false);
    expect(isAegisPayloadUsable({ status: 'complete', score: 80 })).toBe(true);
  });
});

describe('mapLocalSecurityToAegisResponse', () => {
  it('normalizes local probe into Aegis-shaped response', () => {
    const mapped = mapLocalSecurityToAegisResponse({
      url: 'https://example.com/',
      reachable: true,
      httpStatus: 200,
      score: 50,
      checks: [
        { name: 'HTTPS', ok: true, detail: 'Served over TLS' },
        { name: 'HSTS', ok: false, detail: 'Missing' },
        { name: 'X-Frame-Options', ok: false, detail: 'Missing' },
        { name: 'CSP', ok: false, detail: 'Missing' },
      ],
    });

    expect(mapped.source).toBe('cadence-local');
    expect(mapped.status).toBe('complete');
    expect(mapped.grade).toBe('C');
    expect(mapped.summary).toBe('1 of 4 header checks passed');
    expect(mapped.https).toBe(true);
    expect(mapped.hsts).toBe(false);
    expect(mapped.csp).toBe(false);
  });
});

describe('performAegisUrlCheck', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns Aegis result when upstream succeeds', async () => {
    const fetchAegis = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'complete',
          score: 68,
          grade: 'C',
          summary: '0 critical',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await performAegisUrlCheck({
      targetUrl: 'https://example.com',
      fetchAegis,
    });

    expect(fetchAegis).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('aegis-api');
    expect(result.status).toBe('complete');
    expect(result.score).toBe(68);
  });

  it('falls back locally when Aegis returns status failed', async () => {
    const fetchAegis = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ status: 'failed', summary: 'fetch failed' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 200,
          headers: {
            'strict-transport-security': 'max-age=31536000',
            'content-security-policy': "default-src 'self'",
            'x-frame-options': 'DENY',
          },
        }),
      ),
    );

    const result = await performAegisUrlCheck({
      targetUrl: 'https://example.com',
      fetchAegis,
    });

    expect(fetchAegis).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('cadence-local');
    expect(result.status).toBe('complete');
    expect(result.score).toBe(100);
  });

  it('falls back locally when Aegis HTTP fails', async () => {
    const fetchAegis = vi.fn().mockResolvedValue(new Response('bad gateway', { status: 502 }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 403,
          headers: { 'x-frame-options': 'SAMEORIGIN' },
        }),
      ),
    );

    const result = await performAegisUrlCheck({
      targetUrl: 'https://example.com',
      fetchAegis,
    });

    expect(result.source).toBe('cadence-local');
    expect(result.status).toBe('complete');
    expect(result.https).toBe(true);
  });

  it('returns friendly error when both probes fail', async () => {
    const fetchAegis = vi.fn().mockRejectedValue(new Error('upstream down'));

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed')));

    const result = await performAegisUrlCheck({
      targetUrl: 'https://example.com',
      fetchAegis,
    });

    expect(result.connected).toBe(false);
    expect(result.error).toBe(SECURITY_PROBE_FRIENDLY_ERROR);
  });
});

describe('localUrlSecurityCheck', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats non-2xx responses with headers as reachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 401,
          headers: { 'x-frame-options': 'DENY' },
        }),
      ),
    );

    const result = await localUrlSecurityCheck('https://example.com');
    expect(result.reachable).toBe(true);
    expect(result.httpStatus).toBe(401);
    expect(result.checks.find((c) => c.name === 'X-Frame-Options')?.ok).toBe(true);
  });
});
