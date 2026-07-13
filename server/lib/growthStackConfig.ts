/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function citePilotApiBase(): string {
  return (process.env.CITEPILOT_API_URL || 'https://getcitepilot.com').replace(/\/+$/, '');
}

export function aegisApiBase(): string {
  return (process.env.AEGIS_API_URL || 'https://aegis-loop.com').replace(/\/+$/, '');
}

export function pulseApiBase(): string {
  return (process.env.PULSE_API_URL || 'https://pulse-5o1m.onrender.com').replace(
    /\/+$/,
    '',
  );
}

/**
 * Read key for Pulse /api/stats.
 * Prefer per-site PULSE_SITE_KEYS JSON; fall back to PULSE_API_KEY / PULSE_READ_KEY.
 * Later: resolve from Cadence workspace → site ownership table.
 */
export function pulseReadKeyForSite(siteId: string): string | undefined {
  const raw = process.env.PULSE_SITE_KEYS?.trim();
  if (raw) {
    try {
      const map = JSON.parse(raw) as Record<string, unknown>;
      if (map && typeof map === 'object' && !Array.isArray(map)) {
        const siteKey = map[siteId];
        if (typeof siteKey === 'string' && siteKey.trim()) return siteKey.trim();
      }
    } catch {
      /* ignore bad JSON */
    }
  }
  const shared =
    process.env.PULSE_API_KEY?.trim() || process.env.PULSE_READ_KEY?.trim();
  return shared || undefined;
}
