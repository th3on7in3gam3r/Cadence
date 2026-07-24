/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Marketing copy and product metadata for Growth Stack promo surfaces.
 */

import {
  GROWTH_STACK_PRODUCTS,
  aiCmoAppUrl,
  kerygmaHomeUrl,
  postwickHomeUrl,
  pulsePublicOrigin,
  signalDeskHomeUrl,
  signalDeskPublishUrl,
  signalDeskPublicOrigin,
} from '../lib/growthStack';
import { PRODUCT_NAME, STUDIO_PARENT } from '../lib/brand';

export type GrowthStackProductId =
  | 'aiCmo'
  | 'citePilot'
  | 'kerygma'
  | 'postwick'
  | 'aegis'
  | 'pulse';

export interface GrowthStackWorkflowStep {
  id: string;
  product: string;
  label: string;
  description: string;
}

export interface GrowthStackProductCard {
  id: GrowthStackProductId;
  name: string;
  tagline: string;
  href: string;
  external: boolean;
  accentClass: string;
  borderClass: string;
  logoSrc?: string;
  badge?: string;
}

export const GROWTH_STACK_HERO = {
  eyebrow: `${STUDIO_PARENT} · Connected tools`,
  title: 'The Bible Funland Growth Stack',
  subtitle: `One brand URL across ${PRODUCT_NAME}, CitePilot, Signal Desk Blog, and sister apps — find gaps, get cited, create content, publish, distribute, and measure without juggling five subscriptions.`,
};

export const GROWTH_STACK_WORKFLOW: GrowthStackWorkflowStep[] = [
  {
    id: 'aegis',
    product: GROWTH_STACK_PRODUCTS.aegis.name,
    label: 'Find',
    description: 'Scan headers and vulnerabilities before you ship campaigns.',
  },
  {
    id: 'citepilot',
    product: GROWTH_STACK_PRODUCTS.citePilot.name,
    label: 'Cite',
    description: 'Track whether AI assistants mention your brand on buyer prompts.',
  },
  {
    id: 'cadence',
    product: PRODUCT_NAME,
    label: 'Create',
    description: 'Audit SEO, generate blogs, social, email, and keyword plans.',
  },
  {
    id: 'signaldesk',
    product: 'Signal Desk Blog',
    label: 'Publish',
    description: 'Ship citation-ready GEO posts from Cadence to your newsroom.',
  },
  {
    id: 'kerygma',
    product: GROWTH_STACK_PRODUCTS.kerygma.name,
    label: 'Distribute',
    description: 'Turn URLs into autopilot social posts across channels.',
  },
  {
    id: 'pulse',
    product: GROWTH_STACK_PRODUCTS.pulse.name,
    label: 'Measure',
    description: 'See what happens after campaigns land on your site.',
  },
];

export const SIGNAL_DESK_SPOTLIGHT = {
  name: 'Signal Desk Blog',
  eyebrow: 'Connected publish desk',
  tagline: 'Citation-ready GEO newsroom for Cadence & CitePilot',
  description:
    'Publish blog drafts from Cadence directly to your newsroom at signaldeskblog.com. Included with the stack — not a billed sister seat.',
  integrationNote: `Connect in ${PRODUCT_NAME} → Settings → Integrations → Signal Desk.`,
  homeUrl: signalDeskPublicOrigin(),
  openUrl: (campaign = 'growth-stack-promo') => signalDeskHomeUrl(campaign, 'desk-home'),
  publishUrl: (campaign = 'growth-stack-promo') => signalDeskPublishUrl(campaign, 'desk-publish'),
};

export const GROWTH_STACK_TEASER_PILLS = [
  PRODUCT_NAME,
  GROWTH_STACK_PRODUCTS.citePilot.name,
  'Signal Desk Blog',
  GROWTH_STACK_PRODUCTS.kerygma.name,
  GROWTH_STACK_PRODUCTS.aegis.name,
] as const;

export function growthStackProductCards(campaign = 'growth-stack-promo'): GrowthStackProductCard[] {
  return [
    {
      id: 'aiCmo',
      name: GROWTH_STACK_PRODUCTS.aiCmo.name,
      tagline: GROWTH_STACK_PRODUCTS.aiCmo.tagline,
      href: aiCmoAppUrl(),
      external: false,
      accentClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30 shadow-lg shadow-emerald-900/10',
      badge: 'You are here',
    },
    {
      id: 'citePilot',
      name: GROWTH_STACK_PRODUCTS.citePilot.name,
      tagline: GROWTH_STACK_PRODUCTS.citePilot.tagline,
      href: GROWTH_STACK_PRODUCTS.citePilot.url,
      external: true,
      accentClass: 'text-cyan-400',
      borderClass: 'border-cyan-500/20 hover:border-cyan-500/40',
      logoSrc: '/landing/logos/citepilot.svg',
    },
    {
      id: 'kerygma',
      name: GROWTH_STACK_PRODUCTS.kerygma.name,
      tagline: GROWTH_STACK_PRODUCTS.kerygma.tagline,
      href: kerygmaHomeUrl(campaign),
      external: true,
      accentClass: 'text-amber-400',
      borderClass: 'border-amber-500/20 hover:border-amber-500/40',
      logoSrc: '/landing/logos/kerygma.svg',
    },
    {
      id: 'postwick',
      name: GROWTH_STACK_PRODUCTS.postwick.name,
      tagline: GROWTH_STACK_PRODUCTS.postwick.tagline,
      href: postwickHomeUrl(campaign),
      external: true,
      accentClass: 'text-sky-400',
      borderClass: 'border-sky-500/20 hover:border-sky-500/40',
      logoSrc: '/landing/logos/postwick.svg',
      badge: 'Public gallery',
    },
    {
      id: 'aegis',
      name: GROWTH_STACK_PRODUCTS.aegis.name,
      tagline: GROWTH_STACK_PRODUCTS.aegis.tagline,
      href: GROWTH_STACK_PRODUCTS.aegis.url,
      external: true,
      accentClass: 'text-violet-400',
      borderClass: 'border-violet-500/20 hover:border-violet-500/40',
      logoSrc: '/landing/logos/aegis-loop.svg',
    },
    {
      id: 'pulse',
      name: GROWTH_STACK_PRODUCTS.pulse.name,
      tagline: GROWTH_STACK_PRODUCTS.pulse.tagline,
      href: pulsePublicOrigin(),
      external: true,
      accentClass: 'text-teal-400',
      borderClass: 'border-teal-500/20 hover:border-teal-500/40',
    },
  ];
}
