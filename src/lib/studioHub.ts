/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BIBLEFUNLAND_STUDIOS_URL,
  GROWTH_STACK_PRODUCTS,
  aiCmoAppUrl,
  aiCmoStudioBillingUrl,
  type StudioBundleId,
} from './growthStack';

export type StudioHubProductId =
  | 'ai_cmo'
  | 'citepilot'
  | 'kerygma'
  | 'aegis'
  | 'vesper'
  | 'rhemanote'
  | 'pulpit';

export type PersonaId =
  | 'local_business'
  | 'agency'
  | 'saas_dev'
  | 'content_founder'
  | 'church';

export interface StudioHubProduct {
  id: StudioHubProductId;
  name: string;
  tagline: string;
  href: string;
  category: 'growth' | 'church' | 'hub';
  bundleId?: StudioBundleId;
}

export const STUDIO_HUB_PRODUCTS: StudioHubProduct[] = [
  {
    id: 'ai_cmo',
    name: GROWTH_STACK_PRODUCTS.aiCmo.name,
    tagline: GROWTH_STACK_PRODUCTS.aiCmo.tagline,
    href: aiCmoAppUrl(),
    category: 'growth',
    bundleId: 'growth',
  },
  {
    id: 'citepilot',
    name: GROWTH_STACK_PRODUCTS.citePilot.name,
    tagline: GROWTH_STACK_PRODUCTS.citePilot.tagline,
    href: GROWTH_STACK_PRODUCTS.citePilot.url,
    category: 'growth',
    bundleId: 'growth',
  },
  {
    id: 'kerygma',
    name: GROWTH_STACK_PRODUCTS.kerygma.name,
    tagline: GROWTH_STACK_PRODUCTS.kerygma.tagline,
    href: GROWTH_STACK_PRODUCTS.kerygma.url,
    category: 'growth',
    bundleId: 'social',
  },
  {
    id: 'aegis',
    name: GROWTH_STACK_PRODUCTS.aegis.name,
    tagline: GROWTH_STACK_PRODUCTS.aegis.tagline,
    href: GROWTH_STACK_PRODUCTS.aegis.url,
    category: 'growth',
    bundleId: 'devsec',
  },
  {
    id: 'vesper',
    name: 'Vesper',
    tagline: 'Cinematic reels from your sermons',
    href: 'https://vesper.biblefunland.com',
    category: 'church',
  },
  {
    id: 'rhemanote',
    name: 'RhemaNote',
    tagline: 'Scripture-linked study notes from your messages',
    href: 'https://rhemanotes.biblefunland.com',
    category: 'church',
  },
  {
    id: 'pulpit',
    name: 'Pulpit',
    tagline: 'Ministry command center — connect Vesper, Kerygma & RhemaNote',
    href: 'https://pulpit.biblefunland.com',
    category: 'hub',
  },
];

export const PERSONA_OPTIONS: {
  id: PersonaId;
  label: string;
  description: string;
  primaryProduct: StudioHubProductId;
  bundleId?: StudioBundleId;
}[] = [
  {
    id: 'local_business',
    label: 'Local business or church social',
    description: 'Autopilot social posts from your website',
    primaryProduct: 'kerygma',
    bundleId: 'social',
  },
  {
    id: 'agency',
    label: 'Marketing agency',
    description: 'SEO, citations, white-label audits, client brands',
    primaryProduct: 'ai_cmo',
    bundleId: 'studio',
  },
  {
    id: 'saas_dev',
    label: 'SaaS / dev team',
    description: 'Ship securely and get cited by AI buyers',
    primaryProduct: 'aegis',
    bundleId: 'devsec',
  },
  {
    id: 'content_founder',
    label: 'Content-first founder',
    description: 'Strategy, SEO audits, then distribute',
    primaryProduct: 'ai_cmo',
    bundleId: 'growth',
  },
  {
    id: 'church',
    label: 'Church media team',
    description: 'Sermon → reels, posts, and study notes',
    primaryProduct: 'pulpit',
  },
];

export function productById(id: StudioHubProductId): StudioHubProduct | undefined {
  return STUDIO_HUB_PRODUCTS.find((p) => p.id === id);
}

export { BIBLEFUNLAND_STUDIOS_URL, aiCmoStudioBillingUrl };
