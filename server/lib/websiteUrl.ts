/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DOMAIN_FIXES: Record<string, string> = {
  'kerygmasocialc.om': 'kerygmasocial.com',
};

export function normalizeBrandUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    let host = parsed.hostname.toLowerCase();

    if (DOMAIN_FIXES[host]) {
      host = DOMAIN_FIXES[host];
    } else if (host.endsWith('socialc.om')) {
      host = host.replace(/socialc\.om$/, 'social.com');
    }

    parsed.hostname = host;
    const path = parsed.pathname.replace(/\/$/, '') || '';
    return `${parsed.protocol}//${parsed.host}${path}`;
  } catch {
    return trimmed;
  }
}

export function domainFromBrandUrl(input: string): string {
  const normalized = normalizeBrandUrl(input);
  if (!normalized) return '';
  try {
    return new URL(normalized).hostname;
  } catch {
    return normalized.replace(/^https?:\/\//i, '').split('/')[0];
  }
}
