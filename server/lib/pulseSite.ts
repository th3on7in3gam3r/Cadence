/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Must stay in sync with Pulse `siteIdFromDomain` / `normalizeSiteId`.
 */

export function pulseSiteIdFromDomain(domain: string): string {
  const cleaned = domain
    .trim()
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned.slice(0, 48) || 'demo';
}
