/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SecurityHeaderLabel = 'HTTPS' | 'HSTS' | 'CSP';

const HEADER_HELP: Record<
  SecurityHeaderLabel,
  { okHint: string; missingHint: string; fixUrl: string }
> = {
  HTTPS: {
    okHint: 'Served over HTTPS — traffic is encrypted in transit',
    missingHint: 'Site not served over HTTPS — traffic and logins can be intercepted',
    fixUrl: 'https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security',
  },
  HSTS: {
    okHint: 'HSTS present — browsers are forced to use HTTPS',
    missingHint: 'HSTS missing — your site can be downgraded to HTTP',
    fixUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
  },
  CSP: {
    okHint: 'Content Security Policy present — limits untrusted script execution',
    missingHint: 'CSP missing — pages are more vulnerable to script injection',
    fixUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy',
  },
};

export function helpForSecurityHeader(
  label: SecurityHeaderLabel,
  reportUrl?: string,
): { okHint: string; missingHint: string; fixUrl: string } {
  const base = HEADER_HELP[label];
  return {
    ...base,
    fixUrl: reportUrl?.trim() || base.fixUrl,
  };
}
