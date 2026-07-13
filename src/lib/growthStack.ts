/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cross-product URLs for the Bible Funland growth stack (Phase 1).
 * @see docs/GROWTH_STACK_PLAN.md
 */

import { domainFromBrandUrl } from '../utils/websiteUrl';
import { PRODUCT_NAME, PRODUCT_SUBTITLE, PRODUCTION_ORIGIN } from './brand';

export const BIBLEFUNLAND_STUDIOS_URL = 'https://www.biblefunlandstudios.com/';

export const GROWTH_STACK_PRODUCTS = {
  citePilot: {
    name: 'CitePilot',
    tagline: 'Track AI citations on buyer prompts',
    url: 'https://getcitepilot.com',
  },
  kerygma: {
    name: 'Kerygma Social',
    tagline: 'Social posts on autopilot from your URL',
    url: 'https://kerygmasocial.com',
  },
  aegis: {
    name: 'Aegis Loop',
    tagline: 'Find vulnerabilities before you ship',
    url: 'https://aegis-loop.com',
  },
  pulse: {
    name: 'Pulse',
    tagline: 'Measure what happens after campaigns land',
    url: 'https://pulse-5o1m.onrender.com',
  },
  aiCmo: {
    name: PRODUCT_NAME,
    tagline: PRODUCT_SUBTITLE,
    path: '/app',
  },
} as const;

export function aiCmoPublicOrigin(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) {
    return String(import.meta.env.VITE_APP_URL).replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return PRODUCTION_ORIGIN;
}

export function aiCmoAppUrl(): string {
  return `${aiCmoPublicOrigin()}${GROWTH_STACK_PRODUCTS.aiCmo.path}`;
}

/** Strip protocol and path for CitePilot audit deep links. */
export function normalizeDomainForAudit(websiteUrl: string): string {
  return domainFromBrandUrl(websiteUrl);
}

export function citePilotAuditUrl(websiteUrlOrDomain: string): string {
  const domain = normalizeDomainForAudit(websiteUrlOrDomain);
  return `${GROWTH_STACK_PRODUCTS.citePilot.url}/audit?domain=${encodeURIComponent(domain)}`;
}

export function kerygmaSignUpUrl(websiteUrl: string): string {
  const params = new URLSearchParams({
    url: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
    redirect_url: '/onboarding',
  });
  return `${GROWTH_STACK_PRODUCTS.kerygma.url}/sign-up?${params.toString()}`;
}

export type StudioBundleId = 'growth' | 'social' | 'devsec' | 'studio';

/** Deep link to Cadence Settings → Billing (optionally pre-select a bundle). */
export function aiCmoStudioBillingUrl(bundle?: StudioBundleId): string {
  const params = new URLSearchParams({ tab: 'billing' });
  if (bundle) params.set('bundle', bundle);
  return `${aiCmoAppUrl()}/settings?${params.toString()}`;
}

export function aiCmoStudioHubUrl(): string {
  return `${aiCmoPublicOrigin()}/studio`;
}

export function pulsePublicOrigin(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PULSE_URL) {
    return String(import.meta.env.VITE_PULSE_URL).replace(/\/+$/, '');
  }
  return GROWTH_STACK_PRODUCTS.pulse.url;
}

/** Pixel `data-site` for a brand domain — must match Pulse `siteIdFromDomain`. */
export function pulseSiteIdFromBrandUrl(brandUrl: string): string {
  const domain = normalizeDomainForAudit(brandUrl)
    .toLowerCase()
    .replace(/^www\./, '');
  const cleaned = domain
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned.slice(0, 48) || 'demo';
}

export function pulseDashboardUrl(brandUrl: string): string {
  const siteId = pulseSiteIdFromBrandUrl(brandUrl);
  return `${pulsePublicOrigin()}/?site=${encodeURIComponent(siteId)}`;
}

/** In-app router path for Settings → Billing (use with React Router Link). */
export function aiCmoBillingPath(opts?: { bundle?: StudioBundleId; plan?: 'pro' | 'team' }): string {
  const params = new URLSearchParams({ tab: 'billing' });
  if (opts?.bundle) params.set('bundle', opts.bundle);
  if (opts?.plan) params.set('plan', opts.plan);
  return `/app/settings?${params.toString()}`;
}
