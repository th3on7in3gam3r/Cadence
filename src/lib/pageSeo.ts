/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRODUCT_NAME, PRODUCT_SUBTITLE, STUDIO_PARENT, productPublicOrigin } from './brand';

export interface PageSeoConfig {
  path: string;
  title: string;
  description: string;
}

export const DEFAULT_HOME_TITLE = `${PRODUCT_NAME} — Marketing Command Center | Strategy, SEO & Content`;

export const DEFAULT_HOME_DESCRIPTION =
  'Analyze your brand, audit SEO, and generate blogs, social posts, emails, and keyword plans. Run your marketing on cadence — part of Bible Funland Studio.';

export const PAGE_SEO: Record<string, PageSeoConfig> = {
  '/': {
    path: '/',
    title: DEFAULT_HOME_TITLE,
    description: DEFAULT_HOME_DESCRIPTION,
  },
  '/pricing': {
    path: '/pricing',
    title: `${PRODUCT_NAME} Pricing — Free, Pro & Team Plans`,
    description: `Compare ${PRODUCT_NAME} plans: free brand analysis, Pro at $49/mo with integrations and deep SEO crawl, Team at $149/mo with seats and approval workflow.`,
  },
  '/studio': {
    path: '/studio',
    title: `${STUDIO_PARENT} — Growth Stack Bundles`,
    description: `Browse Bible Funland Studio products and bundle pricing. ${PRODUCT_NAME}, CitePilot, Kerygma, and more — one subscription, shared brand URL.`,
  },
  '/help': {
    path: '/help',
    title: `${PRODUCT_NAME} User Guide`,
    description: `Plain-English help for ${PRODUCT_NAME}: brand strategy, SEO audits, content generators, WordPress publishing, and campaign export.`,
  },
  '/privacy': {
    path: '/privacy',
    title: `Privacy Policy — ${PRODUCT_NAME}`,
    description: `How ${PRODUCT_NAME} collects, uses, and protects your workspace data, integrations, and AI-generated content.`,
  },
  '/terms': {
    path: '/terms',
    title: `Terms of Service — ${PRODUCT_NAME}`,
    description: `Terms of use for ${PRODUCT_NAME} — acceptable use, AI output disclaimer, and limitation of liability.`,
  },
  '/security': {
    path: '/security',
    title: `Security — ${PRODUCT_NAME}`,
    description: `${PRODUCT_NAME} security practices: HTTPS, rate limiting, Supabase RLS, and OAuth token handling.`,
  },
  '/data-retention': {
    path: '/data-retention',
    title: `Data Retention — ${PRODUCT_NAME}`,
    description: `How long ${PRODUCT_NAME} retains workspace data, campaign runs, integration tokens, and server logs.`,
  },
};

export function buildCanonical(path: string): string {
  const origin = productPublicOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalized === '/' ? '' : normalized}` || origin;
}

export function getPageSeo(path: string): PageSeoConfig {
  return PAGE_SEO[path] ?? PAGE_SEO['/'];
}

/** Subtitle for pricing page hero */
export const PRICING_PAGE_TAGLINE = PRODUCT_SUBTITLE;
